import { createContext, useContext } from 'react';

const IsSelfContext = createContext<boolean>(false);

export const IsSelfProvider = IsSelfContext.Provider;

export const useIsSelf = (): boolean => useContext(IsSelfContext);
