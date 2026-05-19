const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const login = (email: string, password: string) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const logout = () => request("/auth/logout", { method: "POST" });

export const getMe = () => request("/auth/me");

// Emotions (all authenticated users)
export const getActiveEmotions = () => request("/emotions");

// Patient
export const getPatientFeed = () => request("/patient/posts");
export const createPost = (content: string, emotion_ids: number[]) =>
  request("/patient/posts", { method: "POST", body: JSON.stringify({ content, emotion_ids }) });

// Therapist
export const getTherapistFeed = () => request("/therapist/feed");
export const getMyPatients = () => request("/therapist/patients");

// Admin — Therapists
export const listTherapists = () => request("/admin/therapists");
export const createTherapist = (email: string, full_name: string, password: string) =>
  request("/admin/therapists", { method: "POST", body: JSON.stringify({ email, full_name, password }) });

// Admin — Patients
export const listPatients = () => request("/admin/patients");
export const assignPatient = (patientId: string, therapistId: string) =>
  request(`/admin/patients/${patientId}/assign`, {
    method: "PUT",
    body: JSON.stringify({ therapist_id: therapistId }),
  });

// Admin — Emotions
export const adminListEmotions = () => request("/admin/emotions");
export const adminCreateEmotion = (label: string) =>
  request("/admin/emotions", { method: "POST", body: JSON.stringify({ label }) });
export const adminUpdateEmotion = (id: number, label: string, is_active: boolean) =>
  request(`/admin/emotions/${id}`, { method: "PUT", body: JSON.stringify({ label, is_active }) });
export const adminDeleteEmotion = (id: number) =>
  request(`/admin/emotions/${id}`, { method: "DELETE" });
