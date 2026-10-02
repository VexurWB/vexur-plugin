# Vexur for Claude

Use Vexur, the All-In-One Property Platform, from Claude. This plugin adds the Vexur connector and every Vexur playbook in one install, and keeps the playbooks up to date.

## What you get

- **The Vexur connector** (`https://mcp.vexur.com.au/mcp`). You sign in with your Vexur account and tick what Claude may do. Change it any time in Vexur, Team Lab > Integrations > MCP & AI.
- **Vexur playbooks**: landing pages, campaigns, social, conversations, contacts and deals, lead follow-up, newsletters, blog, website edits, reel editing, property analysis, the property pipeline, AI roles, and a start-here router.

## Install

### Claude Code

```
/plugin marketplace add VexurWB/vexur-plugin
/plugin install vexur@vexur
```

Claude asks you to sign in to Vexur the first time it uses the connector. You can also open `/mcp` and choose `vexur`.

### Claude on the web and desktop

Open Skills, choose Add, and add the marketplace `VexurWB/vexur-plugin`. If Vexur is not connected yet, add it under Connectors with the address `https://mcp.vexur.com.au/mcp`.

## Updates

The playbooks sync from Vexur every hour, and the plugin version goes up only when one changed. Each playbook also tells Claude to load the live version through the connector first, so Claude follows the current one even before an update arrives.

## Support

support@vexur.com.au
