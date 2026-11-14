import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { VIDEO_BUCKET, supabase } from "../lib/supabase.js";

const MAX_FILE_BYTES = 200 * 1024 * 1024;
const EXTENSION_BY_TYPE = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export default function Upload() {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function handleFileChange(event) {
    const selected = event.target.files?.[0] ?? null;
    setError("");
    setDone(false);
    if (selected && !EXTENSION_BY_TYPE[selected.type]) {
      setError("Format video harus MP4, WebM, atau MOV.");
      event.target.value = "";
      setFile(null);
      return;
    }
    if (selected && selected.size > MAX_FILE_BYTES) {
      setError("Ukuran video maksimal 200 MB.");
      event.target.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setError("Pilih file video terlebih dahulu.");
      return;
    }
    setError("");
    setDone(false);
    setSubmitting(true);

    const path = `${profile.id}/${crypto.randomUUID()}.${EXTENSION_BY_TYPE[file.type]}`;
    const { error: uploadError } = await supabase.storage
      .from(VIDEO_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "3600" });
    if (uploadError) {
      setSubmitting(false);
      setError("Video gagal diunggah. Periksa koneksi Anda lalu coba lagi.");
      return;
    }

    const { error: insertError } = await supabase.from("videos").insert({
      title: title.trim(),
      description: description.trim(),
      file_path: path,
    });
    if (insertError) {
      await supabase.storage.from(VIDEO_BUCKET).remove([path]);
      setSubmitting(false);
      setError("Data video belum tersimpan. Silakan coba lagi.");
      return;
    }

    setSubmitting(false);
    setDone(true);
    setTitle("");
    setDescription("");
    setFile(null);
    event.target.reset();
  }

  return (
    <div className="page page--narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Upload video</p>
          <h1>Unggah video baru</h1>
        </div>
        <Link to="/dashboard" className="btn btn-ghost">
          Kembali ke dashboard
        </Link>
      </header>

      <form className="card form-card form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Judul video</span>
          <input
            className="input"
            type="text"
            maxLength={120}
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Deskripsi</span>
          <textarea
            className="input textarea"
            maxLength={2000}
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="field">
          <span>File video</span>
          <input
            className="input file-input"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            required
            onChange={handleFileChange}
          />
          <small className="field__hint">MP4, WebM, atau MOV. Maksimal 200 MB.</small>
        </label>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        {done && (
          <p className="alert alert-success" role="status">
            Video berhasil diunggah dan menunggu persetujuan admin. Anda akan diberi tahu setelah diproses.
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Mengunggah video..." : "Unggah video"}
        </button>
      </form>
    </div>
  );
}
