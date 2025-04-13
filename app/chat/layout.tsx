import { DeepResearchWrapper } from '@/components/deep-research-wrapper';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DeepResearchWrapper>{children}</DeepResearchWrapper>;
}
