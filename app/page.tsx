'use client';

import { User } from 'stream-chat';
import { LoadingIndicator } from 'stream-chat-react';

import { useClerk } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import MyChat from '@/components/MyChat';

const apiKey = 'ey5x2uczenu2';

export type DiscordServer = {
  name: string;
  image: string | undefined;
};

export type Homestate = {
  apiKey: string;
  user: User;
  token: string;
};

export default function Home() {
  const [myState, setMyState] = useState<Homestate | undefined>(undefined);
  const { user: myUser } = useClerk();

  const registerUser = useCallback(async () => {
    try {
      if (!myUser?.id || !myUser?.primaryEmailAddress?.emailAddress) {
        console.warn('User ID or email address is missing.');
        return;
      }

      // register user on Stream backend
      console.log('[registerUser] myUser:', myUser);

      const response = await fetch('/api/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: myUser.id,
          email: myUser.primaryEmailAddress.emailAddress,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error registering user: ${response.statusText}`);
      }

      const responseBody = await response.json();
      console.log('[registerUser] Stream response:', responseBody);
      return responseBody;

    } catch (error) {
      console.error('Error in registerUser:', error);
    }
  }, [myUser]);

  useEffect(() => {
    if (
      myUser?.id &&
      myUser?.primaryEmailAddress?.emailAddress &&
      !myUser?.publicMetadata.streamRegistered
    ) {
      console.log('[Page - useEffect] Registering user on Stream backend');
      registerUser().then((result) => {
        if (result) {
          console.log('[Page - useEffect] Result: ', result);
          getUserToken(
            myUser.id,
            myUser?.primaryEmailAddress?.emailAddress || 'Unknown'
          );
        }
      });
    } else if (myUser?.id) {
      // User is already registered, just get the token
      console.log(
        '[Page - useEffect] User already registered on Stream backend: ',
        myUser?.id
      );
      getUserToken(
        myUser?.id || 'Unknown',
        myUser?.primaryEmailAddress?.emailAddress || 'Unknown'
      );
    }
  }, [registerUser, myUser]);

  if (!myState) {
    return <LoadingIndicator />;
  }

  return <MyChat {...myState} />;

  async function getUserToken(userId: string, userName: string) {
    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error fetching token: ${response.statusText}`);
      }

      const responseBody = await response.json();
      const token = responseBody.token;

      if (!token) {
        throw new Error("Token is missing from the response.");
      }

      const user: User = {
        id: userId,
        name: userName,
        image: `https://getstream.io/random_png/?id=${userId}&name=${userName}`,
      };

      setMyState({
        apiKey: apiKey,
        user: user,
        token: token,
      });
    } catch (error) {
      console.error('Error in getUserToken:', error);
    }
  }
}
