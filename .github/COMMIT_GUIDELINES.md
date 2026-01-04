# Commit Message Guidelines

## Language Requirement
**Always use English** for commit messages to avoid encoding issues in CI/CD platforms and Git history.

## Commit Message Format

```
<type>: <subject>

<body>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

**Good:**
```
feat: add video player feature supporting YouTube and Bilibili

- Add VideoSection type definitions and Zod validation
- Implement VideoSectionEditor component for /admin/cms
- Implement VideoSectionRenderer component for /u/[slug]
```

**Bad:**
```
feat: 添加视频播放器功能
```

## Why English?
- Avoids encoding issues in different systems
- Better compatibility with CI/CD platforms
- Easier for international contributors to understand
- Consistent with most open-source projects

