import React, { useState } from "react";
import { Navigation, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const COORDS = /^-?\d{1,3}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?$/;
const URL_PATTERN = /^(https?:\/\/|www\.)\S+$/i;

// Full-length Google Maps URLs embed the coordinates. !3d/!4d is the
// actual place pin; @lat,lng is only the viewport center, so it's the
// fallback. Short maps.app.goo.gl links contain neither.
function coordsFromUrl(url) {
  let text = url;
  try {
    text = decodeURIComponent(url);
  } catch {
    /* keep the raw string */
  }
  const m =
    text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    text.match(/[?&](?:q|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  return m ? `${m[1]},${m[2]}` : null;
}

// What the map and directions use. `exact` is true only when we have real
// coordinates; otherwise it's a text search, which Google may place loosely.
function getMapTarget(resort) {
  const pin = resort.location?.trim() || "";
  if (COORDS.test(pin)) return { query: pin.replace(/\s+/g, ""), exact: true };

  const fromUrl = URL_PATTERN.test(pin) ? coordsFromUrl(pin) : null;
  if (fromUrl) return { query: fromUrl, exact: true };

  return {
    query: [resort.name, resort.address].filter(Boolean).join(", "),
    exact: false,
  };
}

function getDisplayAddress(resort) {
  if (resort.address) return resort.address;
  const loc = resort.location?.trim() || "";
  return loc && !URL_PATTERN.test(loc) && !COORDS.test(loc) ? loc : "";
}

const ResortLocation = ({ resort }) => {
  const [open, setOpen] = useState(false);

  const label = getDisplayAddress(resort) || "View on map";
  const { query: rawQuery, exact } = getMapTarget(resort);
  const query = encodeURIComponent(rawQuery);

  const pin = resort.location?.trim() || "";
  const pinUrl = URL_PATTERN.test(pin)
    ? /^https?:\/\//i.test(pin)
      ? pin
      : `https://${pin}`
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left underline-offset-2 hover:underline"
      >
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{resort.name}</DialogTitle>
            <DialogDescription>{label}</DialogDescription>
          </DialogHeader>

          <iframe
            title={`Map of ${resort.name}`}
            src={`https://www.google.com/maps?q=${query}&z=16&output=embed`}
            className="h-72 w-full rounded-xl border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          {!exact && (
            <p className="text-xs mt-2 text-ink/50">
              Approximate location based on the address. Use Get Directions for
              navigation.
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            <Button asChild>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${query}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="size-4" />
                Get Directions
              </a>
            </Button>
            {pinUrl && (
              <Button asChild variant="outline">
                <a href={pinUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Open pin in Google Maps
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResortLocation;
