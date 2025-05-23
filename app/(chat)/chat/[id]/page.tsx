import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, DEFAULT_REASONING_MODEL_NAME, models, reasoningModels } from '@/lib/ai/models';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  const reasoningModelIdFromCookie = cookieStore.get('reasoning-model-id')?.value;
  const reasoningModelId =
    reasoningModels.find((model) => model.id === reasoningModelIdFromCookie)?.id ||
    DEFAULT_REASONING_MODEL_NAME;

  return (

    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="relative flex-1 overflow-hidden">

        <Chat
          id={chat.id}
          initialMessages={convertToUIMessages(messagesFromDb)}
          selectedModelId={selectedModelId}
          selectedReasoningModelId={reasoningModelId}
          selectedVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}

        />
        <DataStreamHandler id={id} />
      </div>
    </div>
  );
}
