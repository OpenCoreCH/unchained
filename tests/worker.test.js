import wait from './lib/wait';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { AllocatedWork, NewWork } from './seeds/work';
import { USER_TOKEN, ADMIN_TOKEN } from './seeds/users';

let graphqlFetchAsAdminUser;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;
let workId;

describe('Worker Module', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetchAsAdminUser = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  describe('Happy path', () => {
    it('Standard work gets picked up by the EventListenerWorker.', async () => {
      const addWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT',
        },
      });

      expect(addWorkResult.data.addWork.type).toBe('HEARTBEAT');
      expect(addWorkResult.errors).toBeUndefined();

      const { data: { workQueue } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query ($status: [WorkStatus]) {
            workQueue(status: $status) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          // Empty array as status queries the whole queue
          status: [],
        },
      });

      expect(workQueue.filter(({ type }) => type === 'HEARTBEAT')).toHaveLength(
        1,
      );

      const work = workQueue.find(
        (w) => w._id === addWorkResult.data.addWork._id,
      );

      expect(work.status).toBe('SUCCESS');
    });

    it('Add simple work that cannot fail for external worker', async () => {
      const { data: { addWork } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'EXTERNAL',
        },
      });

      expect(addWork._id).toBeTruthy();
      expect(addWork.type).toBe('EXTERNAL');
    });

    it('Work in the queue', async () => {
      const { data: { workQueue } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query workQueue($created: DateFilterInput) {
            workQueue(created: $created, status: []) {
              _id
              type
            }
          }
        `,
        variables: {
          created: { start: new Date(0), end: null },
        },
      });
      expect(workQueue.filter(({ type }) => type === 'EXTERNAL')).toHaveLength(
        3,
      );
    });

    it('Get work synchroniously. Only one gets it.', async () => {
      const makeAllocatePromise = () =>
        graphqlFetchAsAdminUser({
          query: /* GraphQL */ `
            mutation allocateWork($types: [WorkType], $worker: String) {
              allocateWork(types: $types, worker: $worker) {
                _id
                input
                type
              }
            }
          `,
          variables: {
            worker: 'TEST-GRAPHQL',
            types: ['EXTERNAL'],
          },
        });

      const results = await Promise.all([
        makeAllocatePromise(),
        makeAllocatePromise(),
      ]);

      // There should only be one result with allocated work
      expect(
        results.filter(
          (r) =>
            r.data.allocateWork &&
            r.data.allocateWork.type === 'EXTERNAL' &&
            r.data.allocateWork._id,
        ),
      ).toHaveLength(1);

      // Hoist workId for later use
      workId = results.find(
        (r) => r.data.allocateWork && r.data.allocateWork._id,
      ).data.allocateWork._id;
    });

    it('No more work in the queue', async () => {
      const { data: { workQueue } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
              type
            }
          }
        `,
      });

      expect(workQueue.filter(({ type }) => type === 'HEARTBEAT')).toHaveLength(
        0,
      );
    });

    it('Finish successful work.', async () => {
      const { data: { finishWork } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation finishWork(
            $workId: ID!
            $success: Boolean
            $worker: String
          ) {
            finishWork(workId: $workId, success: $success, worker: $worker) {
              _id
              status
            }
          }
        `,
        variables: {
          workId,
          success: true,
          worker: 'TEST-GRAPHQL',
        },
      });

      expect(finishWork.status).toBe('SUCCESS');
    });

    it('return error when passed invalid workId', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation finishWork(
            $workId: ID!
            $success: Boolean
            $worker: String
          ) {
            finishWork(workId: $workId, success: $success, worker: $worker) {
              _id
            }
          }
        `,
        variables: {
          workId: '',
          success: true,
          worker: 'TEST-GRAPHQL',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('return not found error when non existing workId', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation finishWork(
            $workId: ID!
            $success: Boolean
            $worker: String
          ) {
            finishWork(workId: $workId, success: $success, worker: $worker) {
              _id
            }
          }
        `,
        variables: {
          workId: 'invalid-work-id',
          success: true,
          worker: 'TEST-GRAPHQL',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('WorkNotFoundOrWrongStatus');
    });

    it('Do work.', async () => {
      const addWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
              input
            }
          }
        `,
        variables: {
          type: 'EXTERNAL',
        },
      });

      expect(addWorkResult.data.addWork.type).toBe('EXTERNAL');
      expect(addWorkResult.errors).toBeUndefined();

      const allocateWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation allocateWork($types: [WorkType], $worker: String) {
            allocateWork(worker: $worker, types: $types) {
              _id
              input
              type
            }
          }
        `,
        variables: {
          worker: 'TEST-GRAPHQL',
          types: ['EXTERNAL'],
        },
      });

      expect(allocateWorkResult.errors).toBeUndefined();

      const doWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation doWork($type: WorkType!, $input: JSON) {
            doWork(type: $type, input: $input) {
              result
              error
              success
            }
          }
        `,
        variables: { type: 'HEARTBEAT' },
      });

      expect(doWorkResult.errors).toBeUndefined();
      expect(doWorkResult.data.doWork.success).toBe(true);

      const finishWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation finishWork(
            $workId: ID!
            $success: Boolean
            $result: JSON
            $worker: String
          ) {
            finishWork(
              workId: $workId
              success: $success
              result: $result
              worker: $worker
            ) {
              _id
              status
              result
            }
          }
        `,
        variables: {
          workId: addWorkResult.data.addWork._id,
          ...doWorkResult.data.doWork,
        },
      });

      expect(finishWorkResult.errors).toBeUndefined();
      expect(finishWorkResult.data.finishWork.status).toBe('SUCCESS');
    });

    it('Add future work', async () => {
      const scheduled = new Date();
      scheduled.setSeconds(scheduled.getSeconds() + 2);

      const addWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork(
            $type: WorkType!
            $input: JSON
            $scheduled: Timestamp
          ) {
            addWork(type: $type, input: $input, scheduled: $scheduled) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT',
          scheduled,
        },
      });

      expect(addWorkResult.data.addWork.type).toBe('HEARTBEAT');
      expect(addWorkResult.errors).toBeUndefined();

      const { data: { workQueue: workQueueBefore } = {} } =
        await graphqlFetchAsAdminUser({
          query: /* GraphQL */ `
            query {
              workQueue {
                _id
                worker
                type
              }
            }
          `,
        });

      expect(
        workQueueBefore.filter(({ type }) => type === 'HEARTBEAT'),
      ).toHaveLength(1);

      // Test if work is not done immediately
      await wait(1000);

      const { data: { workQueue: workQueueMiddle } = {} } =
        await graphqlFetchAsAdminUser({
          query: /* GraphQL */ `
            query {
              workQueue {
                _id
                status
                type
                worker
              }
            }
          `,
        });

      expect(
        workQueueMiddle.filter(({ type }) => type === 'HEARTBEAT'),
      ).toHaveLength(1);

      // Test if work is done eventually
      await wait(3000);

      const { data: { workQueue: workQueueAfter } = {} } =
        await graphqlFetchAsAdminUser({
          query: /* GraphQL */ `
            query {
              workQueue {
                _id
                status
                type
                worker
              }
            }
          `,
        });

      expect(
        workQueueAfter.filter(({ type }) => type === 'HEARTBEAT'),
      ).toHaveLength(0);
    });

    it('Worker fails and retries', async () => {
      const addWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON, $retries: Int) {
            addWork(type: $type, input: $input, retries: $retries) {
              _id
              status
              type
              worker
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT',
          input: {
            fails: true,
          },
          retries: 2,
        },
      });

      expect(addWorkResult.errors).toBeUndefined();

      // Hint: If we are super unlucky, the worker already picked up the retry
      // work in this 1 millisecond
      await wait(1);

      // Expect copy & reschedule
      const { data: { workQueue: workQueueBefore } = {} } =
        await graphqlFetchAsAdminUser({
          query: /* GraphQL */ `
            query {
              workQueue {
                _id
                status
                type
                worker
                original {
                  _id
                }
                retries
              }
            }
          `,
        });

      expect(
        workQueueBefore.filter(({ type }) => type === 'HEARTBEAT'),
      ).toHaveLength(1);

      const workBefore = workQueueBefore.pop();

      expect(workBefore.original._id).toBe(addWorkResult.data.addWork._id);
      expect(workBefore.retries).toBe(1);

      // Await the expected reschedule time (should be done by the plugin itself)
      await wait(2000);

      const { data: { workQueue: workQueueAfter } = {} } =
        await graphqlFetchAsAdminUser({
          query: /* GraphQL */ `
            query {
              workQueue {
                _id
                type
                worker
                retries
                # schedule
              }
            }
          `,
        });

      expect(
        workQueueAfter.filter(({ type }) => type === 'HEARTBEAT'),
      ).toHaveLength(1);
    });
  });

  describe('mutation.addWork for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.addWork for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.workQueue for admin user should', () => {
    it('should return all work type and status in the system', async () => {
      const {
        data: { workQueue },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query ($status: [WorkStatus], $selectTypes: [WorkType!]) {
            workQueue(status: $status, selectTypes: $selectTypes) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          status: [],
          selectTypes: [],
        },
      });
      expect(workQueue.length > 0).toBe(true);
    });

    it('should return only works that match the type provided', async () => {
      const {
        data: { workQueue },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query ($status: [WorkStatus], $selectTypes: [WorkType!]) {
            workQueue(status: $status, selectTypes: $selectTypes) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          status: [],
          selectTypes: ['EXTERNAL'],
        },
      });
      expect(workQueue.filter((e) => e.type !== 'EXTERNAL').length).toEqual(0);
    });

    it('should return only works that match the status provided', async () => {
      const {
        data: { workQueue },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query ($status: [WorkStatus], $selectTypes: [WorkType!]) {
            workQueue(status: $status, selectTypes: $selectTypes) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          status: ['SUCCESS'],
          selectTypes: [],
        },
      });
      expect(workQueue.filter((e) => e.status !== 'SUCCESS').length).toEqual(0);
    });

    it('should only return work types that match status and type provided', async () => {
      const {
        data: { workQueue },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query ($status: [WorkStatus], $selectTypes: [WorkType!]) {
            workQueue(status: $status, selectTypes: $selectTypes) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          status: ['SUCCESS'],
          selectTypes: ['EXTERNAL'],
        },
      });
      expect(
        workQueue.filter((w) => w.type !== 'EXTERNAL' || w.status !== 'SUCCESS')
          .length,
      ).toEqual(0);
    });
  });

  describe('query.workQueue for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query ($status: [WorkStatus]) {
            workQueue(status: $status) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          status: [],
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.workQueue for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query ($status: [WorkStatus]) {
            workQueue(status: $status) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          status: [],
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.activeWorkTypes for admin user should', () => {
    it('return all the registered active work types', async () => {
      const {
        data: { activeWorkTypes },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            activeWorkTypes
          }
        `,
        variables: {
          limit: 10,
        },
      });

      expect(activeWorkTypes.length > 0).toBe(true);
    });
  });

  describe('query.activeWorkTypes for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            activeWorkTypes
          }
        `,
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.activeWorkTypes for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            activeWorkTypes
          }
        `,
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.allocateWork for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation allocateWork($types: [WorkType], $worker: String) {
            allocateWork(types: $types, worker: $worker) {
              _id
              input
              type
            }
          }
        `,
        variables: {
          worker: 'TEST-GRAPHQL',
          types: ['EXTERNAL'],
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.allocateWork for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation allocateWork($types: [WorkType], $worker: String) {
            allocateWork(types: $types, worker: $worker) {
              _id
              input
              type
            }
          }
        `,
        variables: {
          worker: 'TEST-GRAPHQL',
          types: ['EXTERNAL'],
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.finishWork for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation finishWork(
            $workId: ID!
            $success: Boolean
            $worker: String
          ) {
            finishWork(workId: $workId, success: $success, worker: $worker) {
              _id
              status
            }
          }
        `,
        variables: {
          workId,
          success: true,
          worker: 'TEST-GRAPHQL',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.finishWork for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation finishWork(
            $workId: ID!
            $success: Boolean
            $worker: String
          ) {
            finishWork(workId: $workId, success: $success, worker: $worker) {
              _id
              status
            }
          }
        `,
        variables: {
          workId,
          success: true,
          worker: 'TEST-GRAPHQL',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Query.work for admin user should', () => {
    it("return the work specified by it's ID", async () => {
      const {
        data: { work },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query work($workId: ID!) {
            work(workId: $workId) {
              _id
              started
              finished
              updated
              deleted
              priority
              type
              status
              worker
              input
              result
              error
              success
              retries
              timeout
              worker

              original {
                _id
              }
            }
          }
        `,
        variables: {
          workId: NewWork._id,
        },
      });
      delete NewWork.created;
      delete NewWork.scheduled;
      expect(work).toMatchObject(NewWork);
    });

    it('return work as null when passed non-existing work ID', async () => {
      const {
        data: { work },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query work($workId: ID!) {
            work(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: 'non-existing-id',
        },
      });
      expect(work).toBe(null);
    });

    it('return InvalidIdError when passed invalid work ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query work($workId: ID!) {
            work(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Query.work for normal user should', () => {
    it('return NoPermissionError ', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query work($workId: ID!) {
            work(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: NewWork._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Query.work for anonymous user should', () => {
    it('return NoPermissionError ', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query work($workId: ID!) {
            work(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: NewWork._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.removeWork for admin user should', () => {
    it("return the work specified by it's ID", async () => {
      const {
        data: { removeWork },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removeWork($workId: ID!) {
            removeWork(workId: $workId) {
              _id
              started
              finished
              created
              updated
              deleted
              priority
              type
              status
              worker
              input
              result
              error
              success
              scheduled
              retries
              timeout
            }
          }
        `,
        variables: {
          workId: AllocatedWork._id,
        },
      });
      expect(removeWork.deleted).not.toBe(null);
    });

    it('return WorkNotFoundOrWrongStatus when passed non-existing work ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removeWork($workId: ID!) {
            removeWork(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('WorkNotFoundOrWrongStatus');
    });

    it('return InvalidIdError when passed invalid work ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removeWork($workId: ID!) {
            removeWork(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.removeWork for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation removeWork($workId: ID!) {
            removeWork(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: AllocatedWork._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.removeWork for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation removeWork($workId: ID!) {
            removeWork(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: AllocatedWork._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });
});
