module github.com/vulnerable-by-design/go-app

go 1.21

// ============================================================================
// DIRECT DEPENDENCIES — vulnerable packages with various version formats
// ============================================================================
require (
	// Exact semantic versions (vMAJOR.MINOR.PATCH)
	github.com/dgrijalva/jwt-go v3.2.0+incompatible           // CVE-2020-26160 — JWT validation bypass
	github.com/gin-gonic/gin v1.6.0                            // CVE-2023-26125 — ReDoS
	github.com/go-yaml/yaml v2.1.0+incompatible                // Multiple CVEs — crash on crafted input
	github.com/gogo/protobuf v1.3.1                            // CVE-2021-3121 — DoS via crafted protobuf
	github.com/gorilla/websocket v1.4.0                        // CVE-2020-27813 — integer overflow
	github.com/miekg/dns v1.0.0                                // CVE-2019-19794 — insufficient randomness
	github.com/prometheus/client_golang v1.11.0                // CVE-2022-21698 — DoS via label cardinality
	golang.org/x/crypto v0.0.0-20200820211705-5c72a883971a     // CVE-2020-29652 — nil pointer panic in SSH
	golang.org/x/net v0.0.0-20210226172049-e18ecbb05110        // CVE-2021-33194 — infinite loop in HTML parser
	golang.org/x/text v0.3.0                                   // CVE-2020-14040 — infinite loop in UTF encoding
	golang.org/x/sys v0.0.0-20210615035016-665e8c7367d1        // Pseudo-version — pinned pre-fix snapshot

	// v0.x pre-stable versions
	github.com/buger/jsonparser v0.0.0-20200322175846-f7e751efca13 // Pseudo-version — pre-release snapshot
	github.com/ulule/limiter v0.0.0-20190417201358-7873d115fc4e    // Pseudo-version — old snapshot

	// v2+ module paths (major version in path)
	github.com/russross/blackfriday/v2 v2.0.1                 // CVE-2020-35381 — XSS in markdown rendering
	github.com/jackc/pgx/v4 v4.6.0                            // Known vulnerable version
	github.com/go-chi/chi/v5 v5.0.0                           // Early v5 release

	// Pre-release / release candidate versions
	github.com/sirupsen/logrus v1.9.0-rc1                      // Pre-release version
	github.com/spf13/cobra v1.5.0-alpha.1                      // Alpha pre-release

	// +incompatible — major version >1 without go.mod
	github.com/satori/go.uuid v1.2.0+incompatible             // CVE-2021-3538 — predictable UUIDs
	github.com/denisenkom/go-mssqldb v0.9.0+incompatible      // Known vulnerable version
	gopkg.in/mgo.v2 v2.0.0-20190816093944-a6b53ec6cb22        // Unmaintained — gopkg.in redirect

	// gopkg.in version aliases
	gopkg.in/yaml.v2 v2.2.2                                   // CVE-2019-11254 — billion laughs DoS
	gopkg.in/yaml.v3 v3.0.0-20200313102051-9f266ea9e77c       // Pre-release pseudo-version

	// Packages with known critical CVEs
	github.com/tidwall/gjson v1.6.0                            // CVE-2021-42836 — ReDoS in path parsing
	github.com/valyala/fasthttp v1.34.0                        // CVE-2022-27664 — HTTP/2 DoS
	github.com/crewjam/saml v0.4.5                             // CVE-2022-41912 — SAML auth bypass
	github.com/docker/distribution v2.7.1+incompatible         // CVE-2023-2253 — OCI manifest DoS
	github.com/opencontainers/runc v1.0.0-rc93                 // CVE-2021-30465 — symlink exchange attack
	github.com/hashicorp/consul/api v1.12.0                    // CVE-2022-29153 — SSRF
	github.com/hashicorp/vault/api v1.3.0                      // Known vulnerable version
	github.com/nats-io/nats-server/v2 v2.12.5                  // CVE-2022-26652 — auth bypass
	github.com/git-lfs/git-lfs v1.5.1-0.20210113091641-3e05bc2b4cf5 // Pseudo-version with pre-release base
	github.com/containers/image/v5 v5.16.0                     // Known vulnerable container image lib
	github.com/containerd/containerd v1.5.7                    // CVE-2021-43816 — privilege escalation
	github.com/aws/aws-sdk-go v1.38.0                          // Known vulnerable version
	github.com/go-git/go-git/v5 v5.4.2                        // CVE-2023-49568 — path traversal

	// Indirect dependencies (pulled transitively) — vulnerable pinned versions
	github.com/pkg/errors v0.9.0       // indirect
	github.com/davecgh/go-spew v1.1.0  // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/stretchr/testify v1.7.0 // indirect
	github.com/modern-go/reflect2 v1.0.1 // indirect
	github.com/json-iterator/go v1.1.9 // indirect — CVE-2024-0406 — stack overflow
)

// ============================================================================
// REPLACE DIRECTIVES — all supported replacement forms
// ============================================================================
replace (
	// Replace with a different module (upstream fork)
	github.com/dgrijalva/jwt-go => github.com/golang-jwt/jwt v3.2.1+incompatible

	// Replace with a local path (relative)
	github.com/pkg/errors => ../local-module

	// Replace with a local path (absolute — example)
	// github.com/example/mod => /home/user/go/src/example/mod

	// Replace a specific version with another specific version
	golang.org/x/crypto v0.0.0-20200820211705-5c72a883971a => golang.org/x/crypto v0.0.0-20210921155107-089bfa567519

	// Replace with a different module entirely
	github.com/go-yaml/yaml => gopkg.in/yaml.v2 v2.2.2
)

// ============================================================================
// EXCLUDE DIRECTIVES — block specific known-bad versions
// ============================================================================
exclude (
	// Exclude a specific version
	github.com/gorilla/websocket v1.4.1

	// Exclude multiple versions of the same module
	golang.org/x/text v0.3.1
	golang.org/x/text v0.3.2
)

// ============================================================================
// RETRACT DIRECTIVES — mark versions of this module as retracted
// ============================================================================
retract (
	// Retract a single version (accidentally published)
	v1.0.0

	// Retract a range of versions (contained a breaking bug)
	[v0.8.0, v0.9.5]
)
