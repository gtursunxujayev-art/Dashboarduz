# Contact Escalation Matrix

## On-Call Rotation

### Primary On-Call
- **Role**: Engineering Team
- **Coverage**: 24/7 rotation
- **Contact**: [Primary Contact]
- **Escalation Time**: Immediate for P0, 15 min for P1

### Secondary On-Call
- **Role**: Team Lead
- **Coverage**: Backup for primary
- **Contact**: [Secondary Contact]
- **Escalation Time**: 1 hour if primary unavailable

## Escalation Paths

### P0 - Critical Incidents
1. **On-Call Engineer** (0-15 min)
2. **Team Lead** (15-30 min)
3. **Engineering Manager** (30-60 min)
4. **CTO** (60+ min)

### P1 - High Priority
1. **On-Call Engineer** (0-1 hour)
2. **Team Lead** (1-2 hours)
3. **Engineering Manager** (2-4 hours)

### P2 - Medium Priority
1. **On-Call Engineer** (0-4 hours)
2. **Team Lead** (4-8 hours)

### P3 - Low Priority
1. **On-Call Engineer** (0-24 hours)

## Contact Methods

### Slack
- **Channel**: #incidents
- **Response Time**: Immediate
- **Use For**: All incidents

### Phone
- **Number**: [Phone Number]
- **Response Time**: 5 minutes
- **Use For**: P0 incidents only

### Email
- **Address**: [Email]
- **Response Time**: 1 hour
- **Use For**: Non-urgent issues

### PagerDuty
- **Integration**: [PagerDuty Service]
- **Response Time**: Immediate
- **Use For**: P0/P1 incidents

## External Contacts

### AWS Support
- **Level**: Business/Enterprise
- **Contact**: AWS Console Support
- **Use For**: Infrastructure issues

### Database Support
- **Provider**: AWS RDS
- **Contact**: AWS Support
- **Use For**: Database issues

### Integration Partners
- **AmoCRM**: [Support Contact]
- **Telegram**: [Bot Support]
- **Google**: [API Support]
- **UTeL**: [Support Contact]

## Communication Templates

### Initial Alert
```
🚨 [SEVERITY] Incident: [Brief Description]

Time: [Timestamp]
Affected: [Services/Users]
On-Call: [Engineer Name]

Investigating...
```

### Status Update
```
📊 Update: [Incident ID]

Status: [Current Status]
ETA: [Estimated Time]
Actions: [What we're doing]
```

### Resolution
```
✅ Resolved: [Incident ID]

Duration: [Time]
Root Cause: [Brief]
Next Steps: [Actions]
```
