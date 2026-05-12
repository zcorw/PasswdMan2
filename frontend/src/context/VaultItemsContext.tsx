import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { createItemId, initialVaultItems, type VaultItem } from '../lib/mockVault';

interface ItemInput {
  title: string;
  url: string;
  username: string;
  favorite: boolean;
  secondaryNotes: string[];
}

interface VaultItemsContextValue {
  items: VaultItem[];
  addItem: (input: ItemInput) => VaultItem;
  updateItem: (id: string, input: ItemInput) => VaultItem | undefined;
}

const VaultItemsContext = createContext<VaultItemsContextValue | undefined>(undefined);

export function VaultItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<VaultItem[]>(initialVaultItems);

  const value = useMemo<VaultItemsContextValue>(
    () => ({
      items,
      addItem(input) {
        const now = new Date().toISOString();
        const item: VaultItem = {
          id: createItemId(input.title),
          title: input.title.trim(),
          url: input.url.trim(),
          username: input.username.trim(),
          favorite: input.favorite,
          status: 'active',
          updatedAt: now,
          secondaryPasswords: input.secondaryNotes
            .map((note, index) => ({ id: `${now}-${index}`, note: note.trim() }))
            .filter((secondary) => secondary.note),
        };
        setItems((current) => [item, ...current]);
        return item;
      },
      updateItem(id, input) {
        let updatedItem: VaultItem | undefined;
        setItems((current) =>
          current.map((item) => {
            if (item.id !== id) {
              return item;
            }
            updatedItem = {
              ...item,
              title: input.title.trim(),
              url: input.url.trim(),
              username: input.username.trim(),
              favorite: input.favorite,
              updatedAt: new Date().toISOString(),
              secondaryPasswords: input.secondaryNotes
                .map((note, index) => ({ id: `${item.id}-${index}`, note: note.trim() }))
                .filter((secondary) => secondary.note),
            };
            return updatedItem;
          }),
        );
        return updatedItem;
      },
    }),
    [items],
  );

  return <VaultItemsContext.Provider value={value}>{children}</VaultItemsContext.Provider>;
}

export function useVaultItems() {
  const context = useContext(VaultItemsContext);
  if (!context) {
    throw new Error('useVaultItems must be used inside VaultItemsProvider');
  }
  return context;
}
