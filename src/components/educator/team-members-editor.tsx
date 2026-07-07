"use client";

import React from "react";

export type TeamMember = {
    name: string;
    title: string;
    bio: string;
};

export function TeamMembersEditor({
    value,
    onChange,
}: {
    value: TeamMember[];
    onChange: (next: TeamMember[]) => void;
}) {
    function update(index: number, patch: Partial<TeamMember>) {
        onChange(value.map((member, i) => (i === index ? { ...member, ...patch } : member)));
    }

    function remove(index: number) {
        onChange(value.filter((_, i) => i !== index));
    }

    function add() {
        onChange([...value, { name: "", title: "", bio: "" }]);
    }

    return (
        <div className="flex flex-col gap-4">
            {value.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                    Add partners or co-presenters who work with your business.
                </p>
            ) : (
                <div className="flex flex-col gap-3">
                    {value.map((member, index) => (
                        <div
                            key={index}
                            className="flex flex-col gap-4 p-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-[var(--text-primary)]">Name</label>
                                    <input
                                        value={member.name}
                                        onChange={(e) => update(index, { name: e.target.value })}
                                        placeholder="Jordan Lee"
                                        className="h-11 rounded-lg border border-[var(--border-subtle)] bg-white px-4 text-sm"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-[var(--text-primary)]">Title / role</label>
                                    <input
                                        value={member.title}
                                        onChange={(e) => update(index, { title: e.target.value })}
                                        placeholder="Co-presenter, Literacy Coach"
                                        className="h-11 rounded-lg border border-[var(--border-subtle)] bg-white px-4 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-[var(--text-primary)]">Bio</label>
                                <textarea
                                    value={member.bio}
                                    onChange={(e) => update(index, { bio: e.target.value })}
                                    rows={3}
                                    placeholder="A short description of what this person contributes."
                                    className="rounded-lg border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm"
                                />
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-xs font-semibold text-red-700 hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div>
                <button
                    type="button"
                    onClick={add}
                    className="text-sm font-bold text-[var(--accent-primary)] hover:underline"
                >
                    Add team member
                </button>
            </div>
        </div>
    );
}
