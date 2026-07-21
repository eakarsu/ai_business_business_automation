const { test, after } = require('node:test');
const assert = require('node:assert/strict');

if (process.env.RUN_DB_TESTS !== 'true') {
  test('HTTP/database workflow (set RUN_DB_TESTS=true)', { skip: true }, () => {});
} else {
  process.env.JWT_SECRET ||= 'integration-test-secret-that-is-at-least-32-characters';
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_EXPERIMENTAL_ROUTES = 'false';
  const { app } = require('../backend/dist/index.js');
  const { PrismaClient } = require('../backend/node_modules/@prisma/client');
  const prisma = new PrismaClient();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, options = {}) => {
    const response = await fetch(base + path, options);
    const raw = response.status === 204 ? '' : await response.text();
    const body = raw && response.headers.get('content-type')?.includes('json') ? JSON.parse(raw) : raw || null;
    return { response, body };
  };
  const auth = token => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

  after(async () => { await prisma.$disconnect(); await new Promise(resolve => server.close(resolve)); });

  test('tenant owner completes the persisted bid lifecycle without cross-tenant access', async () => {
    const suffix = `${Date.now()}-${Math.random()}`;
    const owner = await request('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `owner-${suffix}@example.com`, password: 'ValidPassphrase!123', firstName: 'Owner', lastName: 'One', organization: 'Tenant One' }) });
    assert.equal(owner.response.status, 201);
    assert.equal(owner.body.user.role, 'ADMIN');
    const token = owner.body.token;
    const vendorResult = await request('/api/vendors', { method: 'POST', headers: auth(token), body: JSON.stringify({ name: 'Scoped Vendor', email: 'vendor@example.com' }) });
    assert.equal(vendorResult.response.status, 201);
    const vendor = vendorResult.body.vendor;

    const other = await request('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `other-${suffix}@example.com`, password: 'ValidPassphrase!123', firstName: 'Owner', lastName: 'Two', organization: 'Tenant Two' }) });
    assert.equal(other.response.status, 201);
    const hidden = await request(`/api/vendors/${vendor.id}`, { headers: auth(other.body.token) });
    assert.equal(hidden.response.status, 404);
    const crossTenantBid = await request('/api/bids', { method: 'POST', headers: auth(other.body.token), body: JSON.stringify({ title: 'Forbidden', description: 'Cross tenant', proposedAmount: 100, vendorId: vendor.id }) });
    assert.equal(crossTenantBid.response.status, 404);

    const created = await request('/api/bids', { method: 'POST', headers: auth(token), body: JSON.stringify({ title: 'Tenant RFP response', description: 'Audited proposal', proposedAmount: 25000, vendorId: vendor.id }) });
    assert.equal(created.response.status, 201);
    const bidId = created.body.data.id;
    const invalid = await request(`/api/bids/${bidId}/status`, { method: 'PATCH', headers: auth(token), body: JSON.stringify({ status: 'AWARDED' }) });
    assert.equal(invalid.response.status, 409);
    for (const status of ['UNDER_EVALUATION', 'EVALUATED', 'AWARDED']) {
      const transition = await request(`/api/bids/${bidId}/status`, { method: 'PATCH', headers: auth(token), body: JSON.stringify({ status }) });
      assert.equal(transition.response.status, 200);
      assert.equal(transition.body.data.status, status);
    }
    const prototypes = await request('/api/ai/stats', { headers: auth(token) });
    assert.equal(prototypes.response.status, 404);
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.ok(await prisma.auditLog.count({ where: { tenantId: owner.body.user.tenantId } }) >= 5);
  });
}
