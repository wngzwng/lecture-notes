from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / ".github/workflows/pages.yml"
TESTS = ROOT / ".github/workflows/tests.yml"


class WorkflowSecurityTests(unittest.TestCase):
    def test_actions_are_pinned_to_full_commit_shas(self):
        for path in (PAGES, TESTS):
            self.assertTrue(path.is_file(), path)
            for line in path.read_text().splitlines():
                if "uses:" not in line:
                    continue
                reference = line.split("uses:", 1)[1].strip()
                self.assertRegex(reference, r"^[^@]+@[0-9a-f]{40}$")

    def test_pages_deploys_only_on_trusted_main_and_uses_plain_build(self):
        workflow = PAGES.read_text()
        for required in (
            "branches:\n      - main",
            "PYTHONPATH=. python3 -m scripts.build_site",
            "qpdf --warning-exit-0 --check",
            "actions/deploy-pages@",
            "actions/upload-pages-artifact@",
            "persist-credentials: false",
        ):
            self.assertIn(required, workflow)
        self.assertNotIn("pull_request:", workflow)
        self.assertNotIn("self-hosted", workflow)
        self.assertNotIn("build_site_container.sh", workflow)
        self.assertNotIn("blog.simona.plus", workflow)


if __name__ == "__main__":
    unittest.main()
