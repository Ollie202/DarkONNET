"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BriefcaseBusiness, Check, Mail, UserRound } from "lucide-react";
import { type ProfileSettings, useProfile } from "~~/components/profile/ProfileContext";

const mockPositions = [
  { market: "Will the Fed cut rates before the end of summer 2026?", side: "No", amount: "$20", pnl: "+$3.40" },
  { market: "Will BTC reach $150k before 2026 ends?", side: "Yes", amount: "$10", pnl: "-$1.12" },
  { market: "Will oil trade above $100 before July?", side: "No", amount: "$5", pnl: "+$0.86" },
];

const profileSnapshot = (profile: ProfileSettings) => JSON.stringify(profile);

export default function ProfilePage() {
  const profile = useProfile();
  const [draft, setDraft] = useState<ProfileSettings>({
    profileName: profile.profileName,
    bio: profile.bio,
    email: profile.email,
    receiveUpdates: profile.receiveUpdates,
    receivePositionNotifications: profile.receivePositionNotifications,
  });
  const [savedSnapshot, setSavedSnapshot] = useState(profileSnapshot(draft));
  const [hasConfirmed, setHasConfirmed] = useState(false);

  useEffect(() => {
    const nextDraft = {
      profileName: profile.profileName,
      bio: profile.bio,
      email: profile.email,
      receiveUpdates: profile.receiveUpdates,
      receivePositionNotifications: profile.receivePositionNotifications,
    };
    setDraft(nextDraft);
    setSavedSnapshot(profileSnapshot(nextDraft));
  }, [profile.bio, profile.email, profile.profileName, profile.receivePositionNotifications, profile.receiveUpdates]);

  const isDirty = useMemo(() => profileSnapshot(draft) !== savedSnapshot, [draft, savedSnapshot]);
  const displayName = profile.profileName || "Choose username";

  const updateDraft = <Key extends keyof ProfileSettings>(key: Key, value: ProfileSettings[Key]) => {
    setHasConfirmed(false);
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const save = () => {
    profile.saveProfile(draft);
    setSavedSnapshot(profileSnapshot(draft));
    setHasConfirmed(true);
  };

  return (
    <section className="px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Profile</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#525252] dark:text-[#A1A1A1]">
              Manage your private market identity, notification preferences, and open positions.
            </p>
          </div>
          <div className="rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 dark:border-[#1F1F1F] dark:bg-[#141414]">
            <div className="text-xs text-[#525252] dark:text-[#A1A1A1]">Signed In As</div>
            <div className="mt-1 font-mono text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">{displayName}</div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <form className="rounded-lg border border-[#E5E5E5] bg-white p-5 dark:border-[#1F1F1F] dark:bg-[#141414]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFD60A] text-[#0A0A0A]">
                <UserRound size={19} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Personal Info</h2>
                <p className="text-xs text-[#525252] dark:text-[#A1A1A1]">Used across comments and market activity.</p>
              </div>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Profile Name</span>
                <input
                  value={draft.profileName}
                  onChange={event => updateDraft("profileName", event.target.value)}
                  placeholder="Choose a username"
                  className="mt-2 h-11 w-full rounded-md border border-[#E5E5E5] bg-white px-4 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Bio</span>
                <textarea
                  value={draft.bio}
                  onChange={event => updateDraft("bio", event.target.value)}
                  placeholder="Tell other market participants what you focus on..."
                  className="mt-2 min-h-28 w-full resize-y rounded-md border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]"
                />
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                  <Mail size={16} />
                  Email For Push Notifications
                </span>
                <input
                  type="email"
                  value={draft.email}
                  onChange={event => updateDraft("email", event.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 h-11 w-full rounded-md border border-[#E5E5E5] bg-white px-4 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]"
                />
              </label>

              <div className="space-y-3 rounded-lg border border-[#E5E5E5] bg-[#F8FAFC] p-4 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
                <label className="flex cursor-pointer items-start gap-3 text-sm text-[#525252] dark:text-[#A1A1A1]">
                  <input
                    type="checkbox"
                    checked={draft.receiveUpdates}
                    onChange={event => updateDraft("receiveUpdates", event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#FFD60A]"
                  />
                  <span>Receive notifications about platform and market updates.</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-sm text-[#525252] dark:text-[#A1A1A1]">
                  <input
                    type="checkbox"
                    checked={draft.receivePositionNotifications}
                    onChange={event => updateDraft("receivePositionNotifications", event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#FFD60A]"
                  />
                  <span>Only receive notifications about my open positions.</span>
                </label>
              </div>

              <div className="flex min-h-11 items-center justify-end">
                {isDirty ? (
                  <button
                    type="button"
                    onClick={save}
                    className="smooth-action inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#FFD60A] px-5 text-sm font-semibold text-[#0A0A0A] hover:bg-[#FFD60A]/90"
                  >
                    <Check size={17} />
                    Save Profile
                  </button>
                ) : hasConfirmed ? (
                  <span className="text-sm font-semibold text-[#16A34A] dark:text-[#22C55E]">Profile saved</span>
                ) : null}
              </div>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 dark:border-[#1F1F1F] dark:bg-[#141414]">
              <div className="flex items-center gap-3">
                <BriefcaseBusiness size={18} className="text-[#FFD60A]" />
                <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Open Positions</h2>
              </div>
              <div className="mt-4 space-y-3">
                {mockPositions.map(position => (
                  <div
                    key={position.market}
                    className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-3 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]"
                  >
                    <div className="text-sm font-medium leading-5 text-[#0A0A0A] dark:text-[#FAFAFA]">
                      {position.market}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-[#525252] dark:text-[#A1A1A1]">
                      <span>
                        {position.side} / {position.amount}
                      </span>
                      <span className={position.pnl.startsWith("+") ? "text-[#16A34A]" : "text-[#DC2626]"}>
                        {position.pnl}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 dark:border-[#1F1F1F] dark:bg-[#141414]">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-[#FFD60A]" />
                <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Notification Mode</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">
                {draft.receivePositionNotifications
                  ? "Position alerts are enabled for active markets."
                  : "Position alerts are currently muted."}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
