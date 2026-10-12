"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { PublicArtistProfile } from "@goodhuman/shared";

export default function ArtistHomePage() {
  const [token, setTok] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicArtistProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = getToken();
    setTok(t);
    if (!t) return;
    void api<PublicArtistProfile>("/artists/me/profile", { token: t })
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return setError("Log in as an artist first.");
    setError(null);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    try {
      const updated = await api<PublicArtistProfile>("/artists/me/profile", {
        method: "PUT",
        token,
        body: {
          actName: String(fd.get("actName")),
          bio: String(fd.get("bio") || ""),
          category: String(fd.get("category")),
          city: String(fd.get("city")),
          country: "US",
          region: String(fd.get("region") || ""),
          travelScope: String(fd.get("travelScope")),
          openToTravel: fd.get("openToTravel") === "on",
          socialLinks: String(fd.get("instagram") || "")
            ? [{ platform: "INSTAGRAM", url: String(fd.get("instagram")) }]
            : [],
        },
      });
      setProfile(updated);
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function saveAvailability(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const fd = new FormData(e.currentTarget);
    try {
      await api("/artists/me/availability", {
        method: "PUT",
        token,
        body: {
          dates: [
            {
              date: String(fd.get("date")),
              timezone: String(fd.get("timezone")),
              open: true,
            },
          ],
        },
      });
      setMessage("Availability saved.");
      const refreshed = await api<PublicArtistProfile>("/artists/me/profile", { token });
      setProfile(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Availability failed");
    }
  }

  async function uploadImage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File)) return;
    const body = new FormData();
    body.append("file", file);
    try {
      await api("/media/upload", { token, formData: body });
      setMessage("Image uploaded. Preview is watermarked; original stays private.");
      const refreshed = await api<PublicArtistProfile>("/artists/me/profile", { token });
      setProfile(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function publish() {
    if (!token) return;
    try {
      const published = await api<PublicArtistProfile>("/artists/me/publish", {
        token,
        body: { confirm: true },
      });
      setProfile(published);
      setMessage("Profile published.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    }
  }

  if (!token) {
    return (
      <section className="section">
        <h1>Artist home</h1>
        <p>Log in with an artist account to manage your act.</p>
      </section>
    );
  }

  return (
    <section className="section stack">
      <h1>{profile?.actName ?? "Your act"}</h1>
      <p className="meta">
        {profile?.published ? "Published" : "Draft"} · next open date{" "}
        {profile?.availability[0]?.date ?? "none yet"}
      </p>

      <form className="form" onSubmit={saveProfile}>
        <h2>Profile</h2>
        <label>
          Act name
          <input name="actName" defaultValue={profile?.actName ?? ""} required />
        </label>
        <label>
          Bio
          <textarea name="bio" rows={3} defaultValue={profile?.bio ?? ""} />
        </label>
        <label>
          Category
          <select name="category" defaultValue={profile?.category ?? "SOLO_MUSICIAN"}>
            <option value="DJ">DJ</option>
            <option value="BAND">Band</option>
            <option value="SOLO_MUSICIAN">Solo musician</option>
            <option value="COMEDIAN">Comedian</option>
            <option value="DANCER">Dancer</option>
            <option value="SPEAKER">Speaker</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>
          City
          <input name="city" defaultValue={profile?.city ?? ""} required />
        </label>
        <label>
          Region / state
          <input name="region" defaultValue={profile?.region ?? ""} />
        </label>
        <label style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
          <input
            name="openToTravel"
            type="checkbox"
            defaultChecked={profile?.openToTravel ?? true}
          />
          Open to travel
        </label>
        <label>
          Travel scope
          <select name="travelScope" defaultValue={profile?.travelScope ?? "LOCAL"} required>
            <option value="LOCAL">Local</option>
            <option value="NATIONAL">National</option>
            <option value="INTERNATIONAL">International</option>
          </select>
        </label>
        <label>
          Instagram URL (manual)
          <input
            name="instagram"
            type="url"
            defaultValue={profile?.socialLinks.find((s) => s.platform === "INSTAGRAM")?.url ?? ""}
          />
        </label>
        <button className="btn" type="submit">
          Save profile
        </button>
      </form>

      <form className="form" onSubmit={saveAvailability}>
        <h2>Open date</h2>
        <label>
          Date
          <input name="date" type="date" required />
        </label>
        <label>
          Timezone
          <input name="timezone" defaultValue="America/Chicago" required />
        </label>
        <button className="btn secondary" type="submit">
          Save availability
        </button>
      </form>

      <form className="form" onSubmit={uploadImage}>
        <h2>Gallery image</h2>
        <label>
          Image (JPEG, PNG, or WEBP)
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
        </label>
        <button className="btn secondary" type="submit">
          Upload
        </button>
      </form>

      {profile?.media[0]?.previewUrl ? (
        <div className="preview-frame">
          <img src={profile.media[0].previewUrl} alt="Watermarked preview" />
        </div>
      ) : null}

      <button className="btn" type="button" onClick={() => void publish()}>
        Publish profile
      </button>

      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
