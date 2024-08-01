# companion-module-boxilla-rest-api

See HELP.md and LICENSE

Connecting over https to the server will cause a rejection on nodejs, therefor a variable is set;
``` process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; ```

Preferably we would like to add the certificate
