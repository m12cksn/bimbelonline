# Rollback Checklist (Vercel)

## Trigger
- [ ] Major outage or critical regression confirmed

## Steps
- [ ] Identify last stable deployment in Vercel.
- [ ] Promote last stable deployment to Production.
- [ ] Verify homepage + login works.
- [ ] Verify admin/student critical flows (payments, quiz, zoom).

## Post-Rollback
- [ ] Announce rollback to team.
- [ ] Open incident note with root cause & timeline.
- [ ] Create fix branch and re-deploy after validation.
