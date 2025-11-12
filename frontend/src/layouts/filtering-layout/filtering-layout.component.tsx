interface FilteringLayoutProps {
  children: React.ReactNode;
}

export default function FilteringLayout({ children }: FilteringLayoutProps) {
  return (
    <div className="flex flex-col w-full py-19">
      <div className="box-border px-40 w-full flex flex-col shadow-lg min-h-[8rem] max-small-device-max:px-24 gap-16 mt-10 ">
        {children}
      </div>
    </div>
  );
}
