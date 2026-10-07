import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, FormEvent, useState } from "react";
import { IconAlertCircle, IconUserPlus, IconX } from "@tabler/icons-react";
import api from "../lib/supabaseClient";
import { useNotification } from "./NotificationProvider";
import LoadingSpinner from "./LoadingSpinner";
import {
  getBaseInputClasses,
  getPrimaryButtonClasses,
  getSecondaryButtonClasses,
} from "../lib/twUtils";

export interface CreatedCustomer {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
}
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (customer: CreatedCustomer, existing: boolean) => void;
}
const phonePattern = /^(?:\+91\s?|0)?[6-9]\d{9}$/;
export default function AddCustomerModal({
  isOpen,
  onClose,
  onCreated,
}: Props) {
  const { showSuccessNotification, showErrorNotification } = useNotification();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const reset = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setError("");
  };
  const close = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!fullName.trim() || fullName.trim().length > 200)
      return setError("Please enter a valid full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
      return setError("Please enter a valid email address.");
    if (!phonePattern.test(phone.trim()))
      return setError("Please enter a valid Indian mobile number.");
    setLoading(true);
    try {
      const { data, error: invokeError } = await api.supabase.functions.invoke(
        "admin-create-customer-user",
        {
          body: {
            full_name: fullName.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
          },
        },
      );
      if (invokeError) {
        let serverMessage: string | undefined = (data as any)?.message;
        try {
          const response = (invokeError as any).context as Response | undefined;
          if (!serverMessage && response)
            serverMessage = (await response.clone().json())?.message;
        } catch {
          /* use safe fallback */
        }
        throw new Error(serverMessage || "Unable to add user.");
      }
      if (!data?.success)
        throw new Error(data?.message || "Unable to add user.");
      onCreated(data.user, Boolean(data.existing));
      showSuccessNotification(
        data.existing ? "Existing Customer Found" : "Customer Added",
        `${data.user.full_name} has been selected as the property owner.`,
      );
      reset();
      onClose();
    } catch (caught: any) {
      const message = caught?.message || "Unable to add user.";
      setError(message);
      showErrorNotification("Unable to Add User", message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={close}>
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md rounded-xl bg-white shadow-xl">
              <form onSubmit={submit}>
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <IconUserPlus size={20} /> Add Customer
                  </h2>
                  <button type="button" onClick={close}>
                    <IconX size={20} />
                  </button>
                </div>
                <div className="space-y-4 p-5">
                  {error && (
                    <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <IconAlertCircle size={18} />
                      {error}
                    </div>
                  )}
                  <label className="block text-sm font-medium">
                    Full Name *
                    <input
                      className={getBaseInputClasses()}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      maxLength={200}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Email *
                    <input
                      type="email"
                      className={getBaseInputClasses()}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Mobile Number *
                    <input
                      type="tel"
                      className={getBaseInputClasses()}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      placeholder="+91 9876543210"
                    />
                  </label>
                  <p className="text-xs text-gray-500">
                    The customer will use Google to sign in later. No password
                    is collected here.
                  </p>
                </div>
                <div className="flex justify-end gap-3 border-t px-5 py-4">
                  <button
                    type="button"
                    className={getSecondaryButtonClasses()}
                    onClick={close}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={getPrimaryButtonClasses()}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size={16} /> Creating User...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
