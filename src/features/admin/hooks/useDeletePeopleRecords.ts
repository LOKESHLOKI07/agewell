import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAdminErrorMessage } from '../selectors';

/** Hard-delete selected people records from admin list screens. */
export function useDeletePeopleRecords(resetKey: string | number, deleteOne: (id: string) => Promise<unknown>) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLabel, setDeleteLabel] = useState('');
  const [bulkDelete, setBulkDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedIds([]);
  }, [resetKey]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  const toggleAll = useCallback((pageIds: string[]) => {
    setSelectedIds((prev) => {
      const allOnPage = pageIds.length > 0 && pageIds.every((id) => prev.includes(id));
      return allOnPage ? [] : pageIds;
    });
  }, []);

  const clear = useCallback(() => setSelectedIds([]), []);

  const requestDeleteOne = useCallback((id: string, label: string) => {
    setDeleteId(id);
    setDeleteLabel(label);
  }, []);

  const deleteRecords = useCallback(
    async (ids: string[]) => {
      const unique = [...new Set(ids.filter(Boolean))];
      if (!unique.length) {
        setActionError('Nothing to delete.');
        setBulkDelete(false);
        setDeleteId(null);
        return;
      }
      setBusy(true);
      setActionError(null);
      try {
        for (const id of unique) {
          await deleteOne(id);
        }
        setSelectedIds([]);
        setDeleteId(null);
        setBulkDelete(false);
        await queryClient.invalidateQueries({ queryKey: ['admin'] });
      } catch (error) {
        setActionError(getAdminErrorMessage(error, 'user'));
      } finally {
        setBusy(false);
      }
    },
    [deleteOne, queryClient],
  );

  return {
    selectedIds,
    deleteId,
    deleteLabel,
    bulkDelete,
    busy,
    actionError,
    setBulkDelete,
    setDeleteId,
    toggleOne,
    toggleAll,
    clear,
    requestDeleteOne,
    deleteRecords,
  };
}
