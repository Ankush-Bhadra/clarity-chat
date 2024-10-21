import { useChatContext } from 'stream-chat-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { DiscordServer as AppDiscordServer } from '@/app/page'; // Renamed import to avoid conflict
import { useDiscordContext } from '@/contexts/DiscordContext';
import CreateServerForm from './CreateServerForm';
import Link from 'next/link';
import { Channel } from 'stream-chat';

// Rename the local interface to LocalDiscordServer
interface LocalDiscordServer {
  name: string;
  image?: string; // Optional property
}

const ServerList = () => {
  const { client } = useChatContext();
  const { server: activeServer, changeServer } = useDiscordContext();
  const [serverList, setServerList] = useState<LocalDiscordServer[]>([]);

  const loadServerList = useCallback(async (): Promise<void> => {
    const channels = await client.queryChannels({
      type: 'messaging',
      members: { $in: [client.userID as string] },
    });

    const serverSet: Set<LocalDiscordServer> = new Set(
      channels
        .map((channel: Channel) => {
          // Check if channel.data is defined before accessing its properties
          const channelData = channel.data?.data; // Use optional chaining
          return channelData ? {
            name: channelData.server ?? 'Unknown', // Use nullish coalescing for default value
            image: channelData.image, // Safely access image property
          } : null; // Return null if channelData is undefined
        })
        .filter((server: LocalDiscordServer | null) => server !== null && server.name !== 'Unknown') // Filter out null values
        .filter(
          (server: LocalDiscordServer, index, self) =>
            index === self.findIndex((serverObject) => serverObject.name === server.name)
        )
    );

    const serverArray = Array.from(serverSet.values());
    setServerList(serverArray);
    if (serverArray.length > 0) {
      changeServer(serverArray[0], client);
    }
  }, [client, changeServer]);

  useEffect(() => {
    loadServerList();
  }, [loadServerList]);

  return (
    <div className='bg-dark-gray h-full flex flex-col items-center'>
      <button
        className={`block p-3 aspect-square sidebar-icon border-t-2 border-t-gray-300 ${
          activeServer === undefined ? 'selected-icon' : ''
        }`}
        onClick={() => changeServer(undefined, client)}
      >
        <div className='rounded-icon discord-icon'></div>
      </button>
      <div className='border-t-2 border-t-gray-300'>
        {serverList.map((server) => {
          return (
            <button
              key={server.name}
              className={`p-4 sidebar-icon ${
                server === activeServer ? 'selected-icon' : ''
              }`}
              onClick={() => {
                changeServer(server, client);
              }}
            >
              {server.image && checkIfUrl(server.image) ? (
                <Image
                  className='rounded-icon'
                  src={server.image}
                  width={50}
                  height={50}
                  alt='Server Icon'
                />
              ) : (
                <span className='rounded-icon bg-gray-600 w-[50px] flex items-center justify-center text-sm'>
                  {server.name.charAt(0)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Link
        href={'/?createServer=true'}
        className='flex items-center justify-center rounded-icon bg-white text-green-500 hover:bg-green-500 hover:text-white hover:rounded-xl transition-all duration-200 p-2 my-2 text-2xl font-light h-12 w-12'
      >
        <span className='inline-block'>+</span>
      </Link>
      <CreateServerForm />
    </div>
  );

  function checkIfUrl(path: string): boolean { // Changed to 'boolean' (lowercase b)
    try {
      new URL(path);
      return true;
    } catch (_) {
      return false;
    }
  }
};

export default ServerList;
