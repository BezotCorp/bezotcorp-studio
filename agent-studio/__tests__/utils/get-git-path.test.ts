import { describe, it, expect } from "vitest";
import { DEFAULT_WORKING_DIR } from "#/api/agent-server-config";
import { getGitPath } from "#/utils/get-git-path";

describe("getGitPath", () => {
  it("should return the default working dir when no repository is selected", () => {
    expect(getGitPath(null)).toBe(DEFAULT_WORKING_DIR);
    expect(getGitPath(undefined)).toBe(DEFAULT_WORKING_DIR);
  });

  it("should handle standard owner/repo format (GitHub)", () => {
    expect(getGitPath("BezotCorp/BezotCorp")).toBe(
      `${DEFAULT_WORKING_DIR}/BezotCorp`,
    );
    expect(getGitPath("facebook/react")).toBe(`${DEFAULT_WORKING_DIR}/react`);
  });

  it("should handle nested group paths (GitLab)", () => {
    expect(getGitPath("modernhealth/frontend-guild/pan")).toBe(
      `${DEFAULT_WORKING_DIR}/pan`,
    );
    expect(getGitPath("group/subgroup/repo")).toBe(
      `${DEFAULT_WORKING_DIR}/repo`,
    );
    expect(getGitPath("a/b/c/d/repo")).toBe(`${DEFAULT_WORKING_DIR}/repo`);
  });

  it("should handle single segment paths", () => {
    expect(getGitPath("repo")).toBe(`${DEFAULT_WORKING_DIR}/repo`);
  });

  it("should handle empty string", () => {
    expect(getGitPath("")).toBe(DEFAULT_WORKING_DIR);
  });

  describe("with a backend-provided workspace path", () => {
    it("prefers the explicit workspace path over derived git paths", () => {
      expect(
        getGitPath(
          "BezotCorp/software-agent-sdk",
          "/workspace/project/agent-studio",
        ),
      ).toBe("/workspace/project/agent-studio");
    });

    it("ignores blank workspace paths and falls back to heuristics", () => {
      expect(getGitPath("BezotCorp/software-agent-sdk", "  ")).toBe(
        `${DEFAULT_WORKING_DIR}/software-agent-sdk`,
      );
    });
  });
});
