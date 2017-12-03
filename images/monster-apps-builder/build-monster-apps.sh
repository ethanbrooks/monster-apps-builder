#!/bin/bash -l

set -e


log::m-info "Packaging time!"

for app in ${MONSTER_APPS//,/ }; do
	log::m-info "Packaging $app  ..."
	mkdir -p /tmp/monster-ui-app-${app}_$MONSTER_APPS_VERSION
	pushd $_
		mkdir -p var/www/html/monster-ui/apps
		mv /build/apps/$app $_

		mkdir DEBIAN
		tee DEBIAN/control <<EOF
Package: monster-ui-app-$app
Version: $MONSTER_APPS_VERSION
Architecture: amd64
Maintainer: Joe Black <me@joeblack.nyc>
Description: The $app app for Monster-UI.

EOF

		tee DEBIAN/postinst <<EOF
#!/bin/sh

set -e

case "\$1" in
configure)
	! getent passwd monster-ui > /dev/null 2&>1 && adduser --system --no-create-home --gecos "MonsterUI" --group monster-ui || true
	mkdir -p /var/www/html/monster-ui/apps/$app
	chown -R monster-ui: /var/www/html/monster-ui/apps/$app
	;;
esac

exit 0
EOF
		chmod 0755 DEBIAN/postinst
		cd ..

		dpkg-deb --build monster-ui-app-${app}_$MONSTER_APPS_VERSION
		popd
done


log::m-info "Moving debs to /dist ..."

mv /tmp/*.deb /dist
	pushd /dist
	tar czvf monster-apps-debs-all.tar.gz *.deb

# mkdir -p /dist/dists/stretch/main/binary-amd64
# mkdir -p /dist/pool/main/m
#
# cd /dist
# 	mv /tmp/*.deb /dist/pool/main/m
# 	apt-ftparchive packages . > dists/stretch/main/binary-amd64/Packages
# 	apt-ftparchive release . >  dists/stretch/Release
#
# 	# tar czvf /repo.tar.gz .
# 	mv /repo.tar.gz /dist

# mv /tmp/*.deb /dist
#
#
# log::m-info "Creating archive for debs ..."
# cd /dist
# 	# tar czvf monster-ui-debs-all.tar.gz *.deb
# 	apt-ftparchive packages . > Packages
# 	apt-ftparchive release . > Release


#
# dist/
#     dists/
#         stretch/
#             main/
#                 binary-amd64/
#                     Packages
#             Release
#             Release.gpg
#     pool/
#         main/
#             m/
#                 deb
#                 debs.asc
