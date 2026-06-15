async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-pin': sessionStorage.getItem('pin') ?? '',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  let data = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data
}

export const api = {
  get:  (path)        => request('GET',    path),
  post: (path, body)  => request('POST',   path, body),
  put:  (path, body)  => request('PUT',    path, body),
  patch:(path, body)  => request('PATCH',  path, body),
  del:  (path)        => request('DELETE', path),
}

async function uploadRequest(path, options) {
  const res = await fetch(path, options)
  let data = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export async function uploadBannerPhoto(file) {
  const form = new FormData()
  form.append('photo', file)
  return uploadRequest('/api/upload-banner-photo', {
    method: 'POST',
    headers: { 'x-pin': sessionStorage.getItem('pin') ?? '' },
    body: form,
  })
}

export async function deleteBannerPhoto(url) {
  return uploadRequest('/api/banner-photo', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-pin': sessionStorage.getItem('pin') ?? '',
    },
    body: JSON.stringify({ url }),
  })
}
