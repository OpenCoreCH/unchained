import { Context, Root } from '@unchainedshop/types/api';
import { EnrollmentStatus } from 'meteor/unchained:core-enrollments';
import { log } from 'meteor/unchained:logger';
import { EnrollmentNotFoundError, EnrollmentWrongStatusError, InvalidIdError } from '../../../errors';

export default async function terminateEnrollment(
  root: Root,
  { enrollmentId }: { enrollmentId: string },
  context: Context,
) {
  const { modules, userId } = context;

  log('mutation terminateEnrollment', { userId });

  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });

  const enrollment = await modules.enrollments.findEnrollment({ enrollmentId });
  if (!enrollment) {
    throw new EnrollmentNotFoundError({
      enrollmentId,
    });
  }

  if (enrollment.status === EnrollmentStatus.TERMINATED) {
    throw new EnrollmentWrongStatusError({ status: enrollment.status });
  }

  return modules.enrollments.terminateEnrollment(enrollment, {}, context);
}
