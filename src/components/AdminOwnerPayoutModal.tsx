import { useEffect, useState } from "react";
import {
  getBaseInputClasses,
  getPrimaryButtonClasses,
  getSecondaryButtonClasses,
} from "../lib/twUtils";
import api from "../lib/supabaseClient";

export default function AdminOwnerPayoutModal({
  ownerId,
  propertyId,
  onClose,
  onSaved,
}: {
  ownerId: string;
  propertyId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [v, setV] = useState<any>({});
  const [accounts, setAccounts] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key: string, value: string) =>
    setV((previous: any) => ({ ...previous, [key]: value }));

  useEffect(() => {
    api.supabase.functions
      .invoke("admin-get-owner-payout-summary", {
        body: { owner_user_id: ownerId, property_id: propertyId },
      })
      .then(({ data }) => {
        const list = data?.accounts || [];
        setAccounts(list);
        if (data?.payout)
          setV((previous: any) => ({
            ...previous,
            ...data.payout,
            confirm_account_number: data.payout.account_number || "",
          }));
      });
  }, [ownerId, propertyId]);

  const selectAccount = (accountId: string) => {
    const account = accounts.find(
      (item) => item.payout_account_id === accountId,
    );
    if (account)
      setV((previous: any) => ({
        ...previous,
        ...account,
        confirm_account_number: account.account_number || "",
      }));
  };

  const save = async () => {
    setError("");
    setBusy(true);
    try {
      const { data, error: saveError } = await api.supabase.functions.invoke(
        "admin-save-owner-payout",
        {
          body: {
            target_owner_user_id: ownerId,
            ...v,
            route_consent_accepted: true,
          },
        },
      );
      if (saveError || !data?.success)
        throw new Error(data?.message || "Unable to save payout details.");
      const accountId = data.payout_account_id;
      const assignment = await api.assignPropertyPayoutAccount(
        propertyId,
        accountId,
      );
      if (assignment.error) throw assignment.error;
      const setup = await api.supabase.functions.invoke(
        "setup-owner-route-account",
        { body: { owner_user_id: ownerId, payout_account_id: accountId } },
      );
      if (setup.error || setup.data?.error)
        setError(
          "Details saved and assigned. Route verification can be retried from payout status.",
        );
      onSaved();
      if (!setup.error && !setup.data?.error) onClose();
    } catch (caught: any) {
      setError(caught.message || "Unable to save payout details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Property Payout Account</h2>
        <p className="mt-1 text-sm text-slate-600">
          This account is assigned only to the current property.
        </p>
        {accounts.length > 0 && (
          <label className="mt-4 block text-sm font-medium">
            Existing owner account
            <select
              className={getBaseInputClasses()}
              value={v.payout_account_id || ""}
              onChange={(e) => selectAccount(e.target.value)}
            >
              <option value="">Create another account</option>
              {accounts.map((account) => (
                <option
                  key={account.payout_account_id}
                  value={account.payout_account_id}
                >
                  {account.account_holder_name} ·{" "}
                  {account.masked_account_number}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["account_holder_name", "Account Holder Name"],
            ["account_number", "Account Number"],
            ["confirm_account_number", "Confirm Account Number"],
            ["ifsc_code", "IFSC Code"],
            ["address_line1", "Address Line 1"],
            ["address_line2", "Address Line 2"],
            ["city", "City"],
            ["state", "State"],
            ["pincode", "Pincode"],
            ["pan_number", "PAN"],
          ].map(([key, label]) => (
            <label key={key} className="text-sm font-medium">
              {label}
              {key !== "address_line2" && " *"}
              <input
                className={getBaseInputClasses()}
                value={v[key] || ""}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          ))}
        </div>
        <label className="mt-4 flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!v.consent}
            onChange={(e) => set("consent", String(e.target.checked))}
          />
          I confirm that the property owner authorised these bank and KYC
          details.
        </label>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button className={getSecondaryButtonClasses()} onClick={onClose}>
            Cancel
          </button>
          <button
            className={getPrimaryButtonClasses()}
            disabled={busy || v.consent !== "true"}
            onClick={save}
          >
            {busy ? "Saving..." : "Save & Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
