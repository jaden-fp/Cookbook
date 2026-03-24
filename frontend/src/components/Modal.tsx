import BottomSheet from './BottomSheet';

interface Props {
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export default function Modal({ onClose, children, title }: Props) {
  return (
    <BottomSheet open={true} onClose={onClose} title={title}>
      {children}
    </BottomSheet>
  );
}
