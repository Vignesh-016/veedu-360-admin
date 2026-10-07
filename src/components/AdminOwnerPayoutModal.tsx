import { useEffect, useState } from "react";
import {
  getBaseInputClasses,
  getPrimaryButtonClasses,
  getSecondaryButtonClasses,
} from "../lib/twUtils";
import api from "../lib/supabaseClient";

export default function AdminOwnerPayoutModal({
  ownerId,
  onClose,
  onSaved,
}: {
  ownerId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [v, setV] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, x: string) => setV((p: any) => ({ ...p, [k]: x }));

  useEffect(() => {
    api.supabase.functions
      .invoke("admin-get-owner-payout-summary", {
        body: { owner_user_id: ownerId },
      })
      .then(({ data }) => {
        if (data?.payout) {
          const p = data.payout;
          setV((x: any) => ({
            ...x,
            account_holder_name: p.account_holder_name || "",
            ifsc_code: p.ifsc_code || "",
            account_number: p.account_number || "",
            confirm_account_number: p.account_number || "",
            status: p.status || "",
            ...(p.profile || {}),
          }));
        }
      });
  }, [ownerId]);

  const save = async () => {
    setError("");
    setBusy(true);
    try {
      const { data, error: e } = await api.supabase.functions.invoke(
        "admin-save-owner-payout",
        {
          body: {
            target_owner_user_id: ownerId,
            ...v,
            route_consent_accepted: true,
          },
        },
      );
      if (e || !data?.success)
        throw new Error(
          data?.message || "Unable to save owner payout details.",
        );
      const setup = await api.supabase.functions.invoke(
        "setup-owner-route-account",
        { body: { owner_user_id: ownerId } },
      );
      if (setup.error || setup.data?.error)
        setError(
          "Details saved. Route verification could not be started yet; it can be retried from the owner payout status.",
        );
      onSaved();
      if (!setup.error && !setup.data?.error) onClose();
    } catch (e: any) {
      setError(e.message || "Unable to save owner payout details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Owner Bank & KYC Details</h2>
        {v.status && (
          <p className="mt-1 text-sm text-slate-600">
            Current payout status: {v.status}
          </p>
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
          ].map(([k, l]) => (
            <label key={k} className="text-sm font-medium">
              {l}
              {k !== "address_line2" && " *"}
              <input
                className={getBaseInputClasses()}
                value={v[k] || ""}
                onChange={(e) => set(k, e.target.value)}
              />
            </label>
          ))}
        </div>
        <label className="mt-4 flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!v.consent}
            onChange={(e) => set("consent", String(e.target.checked))}
          />{" "}
          I confirm that the property owner has authorised Veedu360 to use these
          bank and KYC details for payout setup.
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
            {busy ? "Saving..." : "Save & Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}
