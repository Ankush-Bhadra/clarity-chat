import { StreamVideoClient } from '@stream-io/video-client';
import { useEffect, useState } from 'react';
import { UseClientOptions } from './useClient';

export const useVideoClient = ({
  apiKey,
  user,
  tokenOrProvider,
}: UseClientOptions): StreamVideoClient | undefined => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();

  useEffect(() => {
    const streamVideoClient = new StreamVideoClient({ apiKey });
    let didUserConnectInterrupt = false;

    const videoConnectionPromise = streamVideoClient
      .connectUser(user, tokenOrProvider)
      .then(() => {
        if (!didUserConnectInterrupt) {
          setVideoClient(streamVideoClient);
        }
      })
      .catch((error) => {
        console.error('Error connecting user to video client:', error);
      });

    return () => {
      didUserConnectInterrupt = true;
      setVideoClient(undefined);
      videoConnectionPromise
        .then(() => streamVideoClient.disconnectUser())
        .then(() => {
          console.log('Video connection closed');
        });
    };
  }, [apiKey, user.id, tokenOrProvider]);

  return videoClient;
};

// Codec preference setup (based on actual WebRTC stream setup)
export const setupCodecPreferences = (peerConnection: RTCPeerConnection) => {
  try {
    const transceivers = peerConnection.getTransceivers();

    transceivers.forEach((transceiver) => {
      if (transceiver.sender && transceiver.sender.track?.kind === 'video') {
        const videoCapabilities = RTCRtpSender.getCapabilities('video');
        const availableCodecs = videoCapabilities?.codecs ?? [];

        console.log('Supported video codecs:', availableCodecs);

        // Check if H264 is supported
        const h264Codec = availableCodecs.find(
          (codec) => codec.mimeType === 'video/H264'
        );

        if (h264Codec) {
          console.log('Setting H264 codec preferences');
          transceiver.setCodecPreferences([h264Codec]);
        } else {
          console.log('H264 not supported, using VP8 as fallback');
          const vp8Codec = availableCodecs.find(
            (codec) => codec.mimeType === 'video/VP8'
          );
          if (vp8Codec) {
            transceiver.setCodecPreferences([vp8Codec]);
          }
        }
      }
    });
  } catch (error) {
    console.error('Error setting codec preferences:', error);
  }
};
