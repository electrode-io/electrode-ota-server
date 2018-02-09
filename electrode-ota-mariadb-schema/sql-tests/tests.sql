-- user
INSERT INTO user
(email, name)
VALUES ('awhelms@wal-mart.com', 'Anthony Helms');

UPDATE user
SET name = 'Anthony W. Helms'
WHERE id = 1;

SELECT * 
FROM user 
WHERE email = 'awhelms@wal-mart.com';


-- access_key
INSERT INTO access_key
(user_id, name, created_by, 
expires, last_access, friendly_name, 
description)
VALUES(1, '1930f90f20n20fn2092', 'awhelms',
CURRENT_TIMESTAMP + INTERVAL 1 YEAR, NULL, 'Login-1930f90f20n20fn2092',
'LDAP-Generated user access key');

SELECT ak.*
FROM user u, access_key ak
WHERE u.id = ak.user_id
AND u.email = 'awhelms@wal-mart.com';

UPDATE access_key
SET expires = expires + INTERVAL 30 DAY
WHERE id = 1;


-- user_auth_provider
INSERT INTO user_auth_provider
(user_id, provider)
VALUES(1, 'LDAP');

SELECT *
FROM user_auth_provider
WHERE user_id = 1;


-- app
INSERT INTO app
(name)
VALUES('TestApp-iOS');

INSERT INTO app
(name)
VALUES('TestApp-Android');

SELECT *
FROM app
ORDER BY id;


-- app_permission
INSERT INTO app_permission
(user_id, app_id, permission)
VALUES(1, 1, 'Owner');

INSERT INTO app_permission
(user_id, app_id, permission)
VALUES(1, 2, 'Owner');

SELECT ap.*
FROM app_permission ap, user u
WHERE ap.user_id = u.id
AND u.email = 'awhelms@wal-mart.com';


-- deployment
INSERT INTO deployment
(name, deployment_key)
VALUES('Staging', '129408129481041048');

INSERT INTO deployment
(name, deployment_key)
VALUES('Production', 'ifn2ni239n92fni29');

INSERT INTO deployment
(name, deployment_key)
VALUES('Staging', 'fo0nfi2nf032i02fim20');

INSERT INTO deployment
(name, deployment_key)
VALUES('Production', 'anfiopn9pnfwif329n2');

SELECT *
FROM deployment;

SELECT *
FROM deployment
WHERE deployment_key = 'anfiopn9pnfwif329n2';

-- deployment app
INSERT INTO deployment_app
(app_id, deployment_id)
VALUES(1, 1);

INSERT INTO deployment_app
(app_id, deployment_id)
VALUES(1, 2);

INSERT INTO deployment_app
(app_id, deployment_id)
VALUES(2, 3);

INSERT INTO deployment_app
(app_id, deployment_id)
VALUES(2, 4);

SELECT *
FROM deployment_app
WHERE app_id = 1;

SELECT *
FROM deployment_app
WHERE app_id = 2;


-- package
INSERT INTO package
(app_version, blob_url, description,
is_disabled, is_mandatory, label,
manifest_blob_url, package_hash, release_method,
released_by, rollout, size, upload_time)
VALUES('0.0.1', 'http://some/place', 'Release 1',
FALSE, FALSE, 'v1',
'http://some/manifest', '239r0j20jf032j92j', 'Upload',
'awhelms', 100, 192042, CURRENT_TIMESTAMP);

INSERT INTO package
(app_version, blob_url, description,
is_disabled, is_mandatory, label,
manifest_blob_url, package_hash, release_method,
released_by, rollout, size, upload_time)
VALUES('0.0.1', 'http://some/place', 'Release 2',
FALSE, FALSE, 'v2',
'http://some/manifest', 'fi2i92jf0j20fj2', 'Upload',
'awhelms', 100, 192443, CURRENT_TIMESTAMP);

SELECT *
FROM package
WHERE id IN (1,2);

SELECT *
FROM package
WHERE package_hash = 'fi2i92jf0j20fj2';


-- deployment_package_history
INSERT INTO deployment_package_history
(deployment_id, package_id)
VALUES(1, 1);

INSERT INTO deployment_package_history
(deployment_id, package_id)
VALUES(1, 2);

INSERT INTO deployment_package_history
(deployment_id, package_id)
VALUES(2, 1);

INSERT INTO deployment_package_history
(deployment_id, package_id)
VALUES(2, 2);

SELECT *
FROM deployment_package_history
WHERE deployment_id IN (1,2);


-- package_diff
INSERT INTO package_diff
(left_package_id, right_package_id, size, url)
VALUES(2, 1, 1294, 'http://location/of/diff/zip');

SELECT pd.url, p.*
FROM package_diff pd, package p
WHERE pd.left_package_id = p.id
AND p.package_hash = 'fi2i92jf0j20fj2';


-- client_ratio
INSERT INTO client_ratio
(client_unique_id, package_id, ratio, is_updated)
VALUES('390jff2009n20', 2, 70, FALSE);

UPDATE client_ratio
SET is_updated = TRUE, ratio = 90
WHERE client_unique_id = '390jff2009n20'
AND package_id = 2;

SELECT *
FROM client_ratio
WHERE package_id = 2;


-- metric
INSERT INTO metric
(deployment_id, app_version, client_unique_id,
label, status)
VALUES(1, '0.0.1', '390jff2009n20',
'v2', 'Download successful');

INSERT INTO metric
(deployment_id, app_version, client_unique_id,
label, status)
VALUES(1, '0.0.1', '390jff2009n20',
'v2', 'Updated');

SELECT *
FROM metric
WHERE deployment_id = 1;


--package_tag
INSERT INTO package_tag
(tag_name, package_id)
VALUES('100.US', 1);

INSERT INTO package_tag
(tag_name,  package_id)
VALUES('Market 323', 2);

INSERT INTO package_tag
(tag_name, package_id)
VALUES('djergin', 1);

INSERT INTO package_tag
(tag_name, package_id)
VALUES('pilot_group', 2);

SELECT *
FROM package_tag
WHERE package_id IN (1, 2);

SELECT * 
FROM package_tag
WHERE tag_name = '100.US'
AND package_id IN (1, 2);