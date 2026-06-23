import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Group } from "../types";

interface GroupListProps {
  onSelect: (group: Group) => void;
}

export function GroupList({ onSelect }: GroupListProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newName, setNewName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadGroups() {
    setLoading(true);
    try {
      const res = await api.listGroups();
      setGroups(res.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGroups();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    try {
      const res = await api.createGroup(name);
      setGroups((prev) => [res.group, ...prev]);
      setNewName("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const id = joinId.trim();
    if (!id) return;

    try {
      const res = await api.joinGroup(id);
      setGroups((prev) => {
        if (prev.some((g) => g.id === res.group.id)) return prev;
        return [res.group, ...prev];
      });
      setJoinId("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "参加に失敗しました");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">グループを作成</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="グループ名"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            作成
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">グループに参加</h2>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="グループ ID（UUID）"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-200 px-4 py-2 hover:bg-slate-50"
          >
            参加
          </button>
        </form>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">参加中のグループ</h2>
        {loading ? (
          <p className="text-sm text-slate-500">読み込み中...</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-slate-500">グループがありません</p>
        ) : (
          <ul className="space-y-2">
            {groups.map((group) => (
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => onSelect(group)}
                  className="w-full rounded-lg border border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <p className="font-medium">{group.name}</p>
                  <p className="text-xs text-slate-400">{group.id}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
