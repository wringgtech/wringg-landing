"use client";

// Add-a-pickup-address section, used inside the booking flow for a signed-in
// customer. Ported from washmate/apps/customer-mobile/app/add-address.tsx and
// onboarding.tsx (address step), minus the map and reverse geocoding: the
// customer types the address text and the browser gives us only coordinates.
// Behaviour (geolocation only, serviceability gate, race guard) is unchanged;
// the markup follows the customer design system.

import { useRef, useState, type FormEvent } from "react";
import { BookingUnavailable } from "@/components/customer/customer-shell";
import {
  Button,
  ChoiceGroup,
  Notice,
  SectionHeader,
  StatusDot,
  TextField,
} from "@/components/customer/ui";
import { MapPinIcon } from "@/components/customer/icons";
import { cx } from "@/components/customer/ui-helpers";
import { checkServiceability, createAddress } from "@/lib/washmate/api";
import { ApiError, errorMessage } from "@/lib/washmate/client";
import { withAuth } from "@/lib/washmate/session";
import type { Address, CheckServiceabilityResult } from "@/lib/washmate/types";
import { SUPPORT_WHATSAPP_URL } from "@/lib/site-links";

export interface AddressFormProps {
  /** Called with the saved, serviceable address returned by customer-create-address. */
  onSaved: (address: Address) => void;
  /** Optional cancel action (e.g. back to the saved-address list). */
  onCancel?: () => void;
}

const LABEL_CHOICES = ["Home", "Work", "Other"] as const;

interface CapturedLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

const NOT_SERVICEABLE_MESSAGE =
  "We're not in this area yet — WRINGG is piloting in BTM Layout, Bengaluru.";
const PINCODE_PATTERN = /^\d{6}$/;

export function AddressForm({ onSaved, onCancel }: AddressFormProps) {
  const [label, setLabel] = useState<(typeof LABEL_CHOICES)[number]>("Home");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [pincode, setPincode] = useState("");

  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [serviceability, setServiceability] = useState<CheckServiceabilityResult | null>(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);
  const [serviceabilityError, setServiceabilityError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const locationRequestId = useRef(0);

  function markUnavailable(err: unknown, fallback: string): boolean {
    if (err instanceof ApiError && (err.code === "APP_UPDATE_REQUIRED" || err.code === "NOT_CONFIGURED")) {
      setUnavailable(err.message || fallback);
      return true;
    }
    return false;
  }

  // Guarded by locationRequestId: a slow response for an earlier location tap
  // must never overwrite the result for a later one.
  async function checkArea(requestId: number, point: CapturedLocation) {
    setCheckingServiceability(true);
    setServiceabilityError(null);
    try {
      const result = await withAuth((t) =>
        checkServiceability({ latitude: point.latitude, longitude: point.longitude }, t),
      );
      if (requestId !== locationRequestId.current) return;
      setServiceability(result);
    } catch (err) {
      if (requestId !== locationRequestId.current) return;
      if (!markUnavailable(err, "Online booking is not available right now.")) {
        setServiceabilityError(errorMessage(err, "Could not check this area. Please try again."));
      }
    } finally {
      if (requestId === locationRequestId.current) setCheckingServiceability(false);
    }
  }

  function useCurrentLocation() {
    setLocationError(null);
    setServiceability(null);
    setServiceabilityError(null);
    setSaveError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError(
        "Your browser doesn't support location sharing. Please try the WRINGG app, or check this address with support.",
      );
      return;
    }

    const requestId = ++locationRequestId.current;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestId !== locationRequestId.current) return;
        setLocating(false);
        const point: CapturedLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        };
        setLocation(point);
        void checkArea(requestId, point);
      },
      (err) => {
        if (requestId !== locationRequestId.current) return;
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            "Location permission was denied. Please allow location for this site in your browser settings, then try again.",
          );
        } else if (err.code === err.TIMEOUT) {
          setLocationError("Getting your location timed out. Please try again.");
        } else {
          setLocationError("We couldn't get your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  const detailsValid =
    addressLine1.trim().length > 0 && city.trim().length > 0 && PINCODE_PATTERN.test(pincode.trim());
  const serviceable = serviceability?.isServiceable === true;
  const canSave = detailsValid && location !== null && serviceable && !saving;

  async function handleSave(event?: FormEvent) {
    event?.preventDefault();
    setSaveError(null);
    if (!location || !serviceable || !detailsValid) return;

    setSaving(true);
    try {
      const result = await withAuth((t) =>
        createAddress(
          {
            label,
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim() || undefined,
            city: city.trim(),
            pincode: pincode.trim(),
            latitude: location.latitude,
            longitude: location.longitude,
          },
          t,
        ),
      );
      if (!result.isServiceable) {
        setSaveError(NOT_SERVICEABLE_MESSAGE);
        return;
      }
      onSaved({
        ...result.address,
        isServiceable: true,
        serviceZoneId: result.serviceZoneId ?? result.address.serviceZoneId,
      });
    } catch (err) {
      if (!markUnavailable(err, "Online booking is not available right now.")) {
        setSaveError(errorMessage(err, "Could not save this address. Please try again."));
      }
    } finally {
      setSaving(false);
    }
  }

  if (unavailable) {
    return (
      <section aria-label="Add a pickup address">
        <BookingUnavailable message={unavailable} />
      </section>
    );
  }

  const missing: string[] = [];
  if (!location) missing.push("your location (tap the button above)");
  if (!serviceable) missing.push("a check that we serve this area");
  if (!addressLine1.trim()) missing.push("house / flat and street");
  if (!city.trim()) missing.push("your city");
  if (!PINCODE_PATTERN.test(pincode.trim())) missing.push("a 6-digit pincode");

  const checking = locating || checkingServiceability;
  const statusTone = checking
    ? "info"
    : serviceable
      ? "success"
      : serviceability
        ? "danger"
        : "neutral";
  const statusText = locating
    ? "Detecting your location…"
    : checkingServiceability
      ? "Checking if we serve this area…"
      : serviceable
        ? `We serve this area${serviceability?.zone?.name ? ` (${serviceability.zone.name})` : ""}.`
        : serviceability
          ? NOT_SERVICEABLE_MESSAGE
          : location
            ? `Location captured${location.accuracy != null ? ` (±${Math.round(location.accuracy)} m)` : ""}, checking the area…`
            : "Location is required so we can confirm we serve this address.";

  return (
    <section aria-label="Add a pickup address">
      <SectionHeader
        title="Add a pickup address"
        description="We pick up from your door — first confirm the location."
      />

      {/* Location: required to save, checked against our service zones */}
      <div className="mt-5">
        <Button
          variant="secondary"
          size="md"
          onClick={useCurrentLocation}
          loading={locating}
          loadingLabel="Detecting your location…"
          disabled={saving || checkingServiceability}
        >
          <MapPinIcon size={18} />
          Use my current location
        </Button>
        <p role="status" className="mt-3">
          <StatusDot tone={statusTone}>{statusText}</StatusDot>
        </p>
        {locationError || serviceabilityError ? (
          <div className="mt-3">
            <Notice
              tone="error"
              actionLabel="Retry"
              onActionClick={useCurrentLocation}
            >
              {locationError ?? serviceabilityError}
            </Notice>
            <div className="mt-2">
              <Button href={SUPPORT_WHATSAPP_URL} variant="ghost" size="md">
                Message us on WhatsApp
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSave} noValidate className="mt-8 border-t border-[var(--cw-hairline)] pt-7">
        <ChoiceGroup label="Save as" className="max-w-sm">
          <div className="flex flex-wrap gap-2.5">
            {LABEL_CHOICES.map((choice) => (
              <label
                key={choice}
                className="inline-block cursor-pointer rounded-full"
              >
                <input
                  type="radio"
                  name="address-label"
                  value={choice}
                  checked={label === choice}
                  onChange={() => setLabel(choice)}
                  disabled={saving}
                  className="peer sr-only"
                />
                <span
                  className={cx(
                    "inline-flex min-h-10 items-center rounded-full border px-4 text-sm transition-colors duration-150 peer-checked:border-[var(--cw-accent)] peer-checked:bg-[var(--cw-accent-soft)] peer-checked:font-semibold peer-checked:text-[var(--cw-link)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--cw-accent)]",
                    "border-[var(--cw-hairline-strong)] bg-white font-medium text-[var(--cw-body)] hover:bg-[var(--cw-subtle)]",
                  )}
                >
                  {choice}
                </span>
              </label>
            ))}
          </div>
        </ChoiceGroup>

        <div className="mt-6 grid gap-5">
          <TextField
            label="House / flat, street"
            name="addressLine1"
            type="text"
            autoComplete="address-line1"
            placeholder="12, 5th Cross, BTM 2nd Stage"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            disabled={saving}
          />
          <TextField
            label="Landmark (optional)"
            name="addressLine2"
            type="text"
            placeholder="Near Udupi Garden Metro"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            disabled={saving}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="City"
              name="city"
              type="text"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={saving}
            />
            <TextField
              label="Pincode"
              name="pincode"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              placeholder="560076"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={saving}
            />
          </div>
        </div>

        {saveError ? (
          <div className="mt-5">
            <Notice
              tone="error"
              actionLabel="Retry"
              onActionClick={() => {
                // Re-run the same guarded save; canSave gates it anyway.
                if (canSave) void handleSave();
              }}
            >
              {saveError}
            </Notice>
            <div className="mt-2">
              <Button href={SUPPORT_WHATSAPP_URL} variant="ghost" size="md">
                Message us on WhatsApp
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button type="submit" size="lg" loading={saving} loadingLabel="Saving…" disabled={!canSave}>
            Save address
          </Button>
          {onCancel ? (
            <Button variant="secondary" size="lg" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          ) : null}
        </div>
        {!canSave && missing.length > 0 ? (
          <p className="mt-3 text-[13px] leading-[18px] text-[var(--cw-muted)]">
            To save this address we need {missing.join(", ")}. {missing.length === 1 ? "It's" : "They're"} quick to add.
          </p>
        ) : null}
      </form>
    </section>
  );
}
