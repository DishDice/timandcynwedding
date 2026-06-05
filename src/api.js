const base = (method, path, body) =>
  fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-pin': sessionStorage.getItem('pin') ?? '',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then(r => r.json());

export const api = {
  get:  (path)        => base('GET',    path),
  post: (path, body)  => base('POST',   path, body),
  put:  (path, body)  => base('PUT',    path, body),
  del:  (path)        => base('DELETE', path),
};

export async function uploadBannerPhoto(file) {
  const form = new FormData();
  form.append('photo', file);
  const res = await fetch('/api/upload-banner-photo', {
    method: 'POST',
    headers: { 'x-pin': sessionStorage.getItem('pin') ?? '' },
    body: form,
  });
  return res.json();
}

export async function deleteBannerPhoto(url) {
  const res = await fetch('/api/banner-photo', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-pin': sessionStorage.getItem('pin') ?? '',
    },
    body: JSON.stringify({ url }),
  });
  return res.json();
}
