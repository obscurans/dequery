.DEFAULT_GOAL := all
.PHONY: all clean
SHELL := /bin/bash

include icon.mk

all_icons := $(foreach type,$(icon_types),$(foreach size,$(sizes_$(type)),src/$(type)$(size).png))

type_of = $(shell echo $(notdir $1) | sed -n 's|^\([^0-9]*\)[0-9]*\.png$$|\1|p')
size_of = $(shell echo $(notdir $1) | sed -n 's|^[^0-9]*\([0-9]*\)\.png$$|\1|p')
fg_color = $(firstword $(color_$(call type_of,$1)))
bg_color = $(lastword $(color_$(call type_of,$1)))

all: $(all_icons)

clean:
	-rm $(all_icons)

src/%.png: icon.svg icon.mk
	rsvg-convert -w $(call size_of,$@) -h $(call size_of,$@) <(sed -e 's|$$FGCOLOR|$(call fg_color,$@)|g' -e 's|$$BGCOLOR|$(call bg_color,$@)|g' icon.svg) -o $@
