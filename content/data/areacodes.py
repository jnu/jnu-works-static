#!/var/chroot/home/content/41/10223541/html/python/bin/python
#coding=utf8

ac = None
with open("areacodes.json") as fh:
    ac = fh.read()


print "Content-type: application/json;charset=utf-8"
print
print ac