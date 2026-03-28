<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Env File

When running commands on your behalf, do not hardcode env secrets in the command line. Read them from .env.local, so the command line remains clean from secrets.

# DO NOT RUN GIT COMMANDS!

Never git add and never git commit your changes!

# Do not deploy after each change!

After you make a change to the code, do NOT deploy. I will ask to deploy explicitly when needed.
