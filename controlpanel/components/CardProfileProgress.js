import React from 'react';
import Link from 'next/link';
import { Card, Image, Button } from 'semantic-ui-react';

export default ({ avatarUrl }) => (
  <Card color="black" raised>
    <Card.Content>
      <Image floated="right" size="mini" src={avatarUrl} />
      <Card.Header>
        Steckbrief
      </Card.Header>
      <Card.Meta>
        Kontaktangaben
      </Card.Meta>
      <Card.Description>
        Profil komplett
      </Card.Description>
    </Card.Content>
    <Card.Content extra>
      <Button.Group>
        <Link href="/users/profile">
          <Button as="a" basic secondary>
            Mein Profil bearbeiten
          </Button>
        </Link>
      </Button.Group>
    </Card.Content>
  </Card>
);
