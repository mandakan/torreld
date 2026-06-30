import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import build  # noqa: E402


class TestEscaping(unittest.TestCase):
    def test_escape_xml_escapes_all_five(self):
        self.assertEqual(
            build.escape_xml('a & b < c > d " e \' f'),
            'a &amp; b &lt; c &gt; d &quot; e &#39; f',
        )

    def test_truncate_short_string_unchanged(self):
        self.assertEqual(build.truncate("hello", 10), "hello")

    def test_truncate_long_string_gets_ascii_ellipsis(self):
        out = build.truncate("abcdefghij", 8)
        self.assertEqual(out, "abcde...")
        self.assertTrue(out.endswith("..."))


class TestExtractPackMeta(unittest.TestCase):
    def test_uses_share_block_when_present(self):
        text = '''
          name: "Reloads",
          documentTitle: "TORRELD - Reloads dry-fire",
          share: {
            title: "Reloads dry-fire",
            tagline: "The mag goes where you look",
            description: "Builds the look-in until the seat happens without thought.",
          },
        '''
        m = build.extract_pack_meta(text, "reloads")
        self.assertEqual(m["id"], "reloads")
        self.assertEqual(m["title"], "Reloads dry-fire")
        self.assertEqual(m["tagline"], "The mag goes where you look")
        self.assertEqual(
            m["description"],
            "Builds the look-in until the seat happens without thought.",
        )

    def test_falls_back_to_name_and_site_defaults(self):
        text = 'name: "Stage planning",\n documentTitle: "TORRELD - Stage planning dry-fire",'
        m = build.extract_pack_meta(text, "stage-planning")
        self.assertEqual(m["title"], "Stage planning")
        self.assertEqual(m["tagline"], "")
        self.assertEqual(m["description"], build.SITE_DESCRIPTION)
        self.assertEqual(m["document_title"], "TORRELD - Stage planning dry-fire")

    def test_id_is_stem_even_if_no_fields(self):
        m = build.extract_pack_meta("", "whatever")
        self.assertEqual(m["id"], "whatever")
        self.assertEqual(m["name"], "whatever")


class TestRenderOgSvg(unittest.TestCase):
    TPL = '<svg>{{TITLE}}|{{TAGLINE}}</svg>'

    def test_fills_tokens(self):
        out = build.render_og_svg(self.TPL, "Reloads", "look-in")
        self.assertEqual(out, "<svg>Reloads|look-in</svg>")

    def test_escapes_and_has_no_raw_angle_brackets_in_values(self):
        out = build.render_og_svg(self.TPL, "A & <b>", "")
        self.assertIn("A &amp; &lt;b&gt;", out)

    def test_truncates_long_title(self):
        long = "x" * 80
        out = build.render_og_svg(self.TPL, long, "")
        self.assertNotIn("x" * 80, out)
        self.assertIn("...", out)


class TestRenderStub(unittest.TestCase):
    META = {
        "id": "reloads",
        "title": "Reloads dry-fire",
        "description": "Look-in and carrier index.",
    }

    def setUp(self):
        self.html = build.render_stub(self.META, "https://torreld.urdr.dev")

    def test_canonical_points_to_app_url(self):
        self.assertIn(
            '<link rel="canonical" href="https://torreld.urdr.dev/?pack=reloads">',
            self.html,
        )

    def test_og_image_is_absolute_png(self):
        self.assertIn(
            '<meta property="og:image" content="https://torreld.urdr.dev/og/reloads.png">',
            self.html,
        )

    def test_og_url_is_stub_url(self):
        self.assertIn(
            '<meta property="og:url" content="https://torreld.urdr.dev/p/reloads">',
            self.html,
        )

    def test_twitter_large_card(self):
        self.assertIn('name="twitter:card" content="summary_large_image"', self.html)

    def test_body_redirects_preserving_hash(self):
        self.assertIn('location.replace("/?pack=reloads" + location.hash)', self.html)

    def test_noscript_fallback_present(self):
        self.assertIn('http-equiv="refresh"', self.html)
        self.assertIn('href="/?pack=reloads"', self.html)


class TestFaviconAndHead(unittest.TestCase):
    def test_favicon_svg_is_single_line_and_has_mask(self):
        self.assertNotIn("\n", build.FAVICON_SVG)
        self.assertIn("<mask", build.FAVICON_SVG)
        self.assertIn("linearGradient", build.FAVICON_SVG)

    def test_data_uri_prefix_and_encoding(self):
        uri = build.favicon_data_uri("<svg><rect/></svg>")
        self.assertTrue(uri.startswith("data:image/svg+xml,"))
        self.assertNotIn("<", uri)  # angle brackets must be percent-encoded
        self.assertIn("%3C", uri)

    def test_render_head_has_icon_and_default_og(self):
        head = build.render_head("data:image/svg+xml,FAKE", "https://torreld.urdr.dev")
        self.assertIn('rel="icon" type="image/svg+xml" href="data:image/svg+xml,FAKE"', head)
        self.assertIn('<meta property="og:image" content="https://torreld.urdr.dev/og/default.png">', head)
        self.assertIn('name="twitter:card" content="summary_large_image"', head)


class TestRasterize(unittest.TestCase):
    def test_returns_false_and_skips_when_tool_missing(self):
        from unittest import mock
        with mock.patch("build.shutil.which", return_value=None):
            with mock.patch("build.subprocess.run") as run:
                ok = build.rasterize("a.svg", "a.png", 32, 32)
        self.assertFalse(ok)
        run.assert_not_called()

    def test_invokes_rsvg_convert_when_present(self):
        from unittest import mock
        with mock.patch("build.shutil.which", return_value="/usr/bin/rsvg-convert"):
            with mock.patch("build.subprocess.run") as run:
                ok = build.rasterize("a.svg", "a.png", 64, 48, background="#0a0d0e")
        self.assertTrue(ok)
        args = run.call_args[0][0]
        self.assertIn("/usr/bin/rsvg-convert", args)
        self.assertIn("-w", args)
        self.assertIn("64", args)
        self.assertIn("-b", args)
        self.assertIn("#0a0d0e", args)


if __name__ == "__main__":
    unittest.main()
