// Edge Function: เจ้าของร้านสร้าง/แก้ไข/ปิดบัญชีผู้ใช้
// ใช้ SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ที่ Supabase ใส่ให้อัตโนมัติ
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const USERNAME = /^[a-z0-9._-]{3,30}$/
const DOMAIN = 'taptale.local'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: authData } = await admin.auth.getUser(token)
  const caller = authData?.user
  if (!caller) return json({ error: 'unauthorized' }, 401)
  const { data: me } = await admin.from('profiles').select('role, active').eq('id', caller.id).single()
  if (!me || me.role !== 'owner' || !me.active) return json({ error: 'forbidden' }, 403)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'bad_json' }, 400) }

  const activeOwners = async (excludeId?: string) => {
    const { data } = await admin.from('profiles').select('id').eq('role', 'owner').eq('active', true)
    return (data ?? []).filter((p) => p.id !== excludeId).length
  }

  if (body.action === 'create') {
    const username = String(body.username ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const displayName = String(body.display_name ?? '').trim() || username
    const role = body.role === 'owner' ? 'owner' : 'staff'
    if (!USERNAME.test(username)) return json({ error: 'bad_username' }, 400)
    if (password.length < 8) return json({ error: 'weak_password' }, 400)

    const { data, error } = await admin.auth.admin.createUser({
      email: `${username}@${DOMAIN}`,
      password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { display_name: displayName },
    })
    if (error) return json({ error: error.message.includes('already') ? 'username_taken' : 'create_failed' }, 400)
    if (body.wage_per_shift != null) {
      await admin.from('profiles').update({ wage_per_shift: Number(body.wage_per_shift) || 0 }).eq('id', data.user.id)
    }
    return json({ ok: true, id: data.user.id })
  }

  if (body.action === 'update') {
    const id = String(body.id ?? '')
    if (!id) return json({ error: 'bad_id' }, 400)
    const { data: target } = await admin.from('profiles').select('id, role, active, approved_at').eq('id', id).single()
    if (!target) return json({ error: 'not_found' }, 404)

    const patch: Record<string, unknown> = {}
    if (typeof body.display_name === 'string' && body.display_name.trim()) patch.display_name = body.display_name.trim()
    if (body.role === 'owner' || body.role === 'staff') patch.role = body.role
    if (typeof body.active === 'boolean') patch.active = body.active
    if (body.wage_per_shift != null) patch.wage_per_shift = Number(body.wage_per_shift) || 0
    if (patch.active === true && !target.approved_at) patch.approved_at = new Date().toISOString()

    const losingOwner = target.role === 'owner' && target.active && (patch.role === 'staff' || patch.active === false)
    if (losingOwner && (await activeOwners(id)) === 0) return json({ error: 'last_owner' }, 400)
    if (id === caller.id && patch.active === false) return json({ error: 'cannot_disable_self' }, 400)

    if (Object.keys(patch).length) {
      const { error } = await admin.from('profiles').update(patch).eq('id', id)
      if (error) return json({ error: 'update_failed' }, 400)
    }

    const authPatch: Record<string, unknown> = {}
    if (typeof body.password === 'string' && body.password) {
      if (body.password.length < 8) return json({ error: 'weak_password' }, 400)
      authPatch.password = body.password
    }
    if (patch.role) authPatch.app_metadata = { role: patch.role }
    if (patch.active === false) authPatch.ban_duration = '876000h'
    if (patch.active === true) authPatch.ban_duration = 'none'
    if (Object.keys(authPatch).length) {
      const { error } = await admin.auth.admin.updateUserById(id, authPatch)
      if (error) return json({ error: 'auth_update_failed' }, 400)
    }
    return json({ ok: true })
  }

  if (body.action === 'reject') {
    const id = String(body.id ?? '')
    const { data: target } = await admin.from('profiles').select('approved_at').eq('id', id).single()
    if (!target) return json({ error: 'not_found' }, 404)
    if (target.approved_at) return json({ error: 'not_pending' }, 400)
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) return json({ error: 'delete_failed' }, 400)
    return json({ ok: true })
  }

  return json({ error: 'unknown_action' }, 400)
})
