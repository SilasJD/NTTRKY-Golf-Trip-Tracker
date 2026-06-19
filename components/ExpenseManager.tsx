"use client";

import { useState } from "react";
import { supabase, type Expense, type ExpenseCategory } from "@/lib/supabase/client";
import { players } from "@/lib/players";
import { notifySaveError } from "@/lib/toast";

type Props = {
  expenses: Expense[];
};

type DraftExpense = {
  description: string;
  category: ExpenseCategory;
  amount: string;
  paid_by: string;
  split_among: string[];
};

const emptyDraft: DraftExpense = {
  description: "",
  category: "trip",
  amount: "",
  paid_by: players[0],
  split_among: [...players],
};

const categoryLabels: Record<ExpenseCategory, string> = {
  green_fees: "Green Fees",
  skins: "Skins",
  trip: "Trip Expense",
};

export function ExpenseManager({ expenses }: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftExpense>(emptyDraft);
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(true);
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setDraft({
      description: expense.description,
      category: expense.category,
      amount: String(expense.amount),
      paid_by: expense.paid_by,
      split_among: expense.split_among,
    });
    setOpen(true);
  }

  function toggleSplit(name: string) {
    setDraft((d) =>
      d.split_among.includes(name)
        ? { ...d, split_among: d.split_among.filter((p) => p !== name) }
        : { ...d, split_among: [...d.split_among, name] }
    );
  }

  async function save() {
    const amount = Number(draft.amount);
    if (!draft.description || !amount || amount <= 0 || draft.split_among.length === 0) return;
    setSaving(true);
    const payload = {
      description: draft.description,
      category: draft.category,
      amount,
      paid_by: draft.paid_by,
      split_among: draft.split_among,
    };
    let ok = true;
    if (editingId) {
      const { error } = await supabase.from("expenses").update(payload).eq("id", editingId);
      if (error) {
        console.error(error);
        notifySaveError("expense", save);
        ok = false;
      }
    } else {
      const { error } = await supabase.from("expenses").insert(payload);
      if (error) {
        console.error(error);
        notifySaveError("expense", save);
        ok = false;
      }
    }
    setSaving(false);
    if (ok) setOpen(false);
  }

  async function doRemove(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      console.error(error);
      notifySaveError("expense deletion", () => doRemove(id));
    }
  }

  function remove(id: string) {
    if (!confirm("Delete this expense?")) return;
    doRemove(id);
  }

  return (
    <div className="rounded-xl bg-slate-100 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Expenses</p>
        <button
          onClick={startCreate}
          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white active:bg-emerald-800"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {expenses.length === 0 && <p className="text-sm text-slate-600">No expenses logged yet.</p>}
        {expenses.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{e.description}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700">
                  {categoryLabels[e.category]}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                ${e.amount.toFixed(2)} · {e.paid_by} paid · split: {e.split_among.join(", ")}
              </div>
            </div>
            <div className="flex gap-2 pl-2">
              <button onClick={() => startEdit(e)} className="text-xs text-emerald-700">
                Edit
              </button>
              <button onClick={() => remove(e.id)} className="text-xs text-red-600">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
          <label className="flex flex-col gap-1 text-sm">
            Description
            <input
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Cart fees, pizza, lodging…"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Amount ($)
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={draft.amount}
              onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Category
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as ExpenseCategory }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Paid by
            <select
              value={draft.paid_by}
              onChange={(e) => setDraft((d) => ({ ...d, paid_by: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {players.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1 text-sm">
            Split among
            <div className="grid grid-cols-3 gap-2">
              {players.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleSplit(name)}
                  className={`rounded-lg border px-2 py-1.5 text-sm ${
                    draft.split_among.includes(name)
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-300 text-slate-700"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
