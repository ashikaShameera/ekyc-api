export function maskEmail(email) {
  const [local, domain] = email.split('@');

  if (local.length <= 3) {
    return '*'.repeat(local.length) + '@' + domain;
  }

  const visible = local.slice(0, 3);
  const masked = '*'.repeat(local.length - 3);

  return `${visible}${masked}@${domain}`;
}
