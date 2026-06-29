/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

interface SelectedPackageCtx {
  selectedTitle: string;
  setSelectedTitle: (title: string) => void;
}

const Ctx = createContext<SelectedPackageCtx>({
  selectedTitle: '',
  setSelectedTitle: () => {},
});

export function SelectedPackageProvider({ children }: { children: React.ReactNode }) {
  const [selectedTitle, setSelectedTitle] = useState('');
  return (
    <Ctx.Provider value={{ selectedTitle, setSelectedTitle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSelectedPackage() {
  return useContext(Ctx);
}
