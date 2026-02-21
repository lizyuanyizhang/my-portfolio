#!/usr/bin/env python3
"""
BFG 替代方案：用于 git filter-branch 的 tree-filter 脚本
将历史中的 Notion S3 临时 URL 替换为安全占位符
"""
import os
import sys

TARGET_FILE = "src/i18n/data.zh.json"
OLD_URL = "https://prod-files-secure.s3.us-west-2.amazonaws.com/90c391f7-355e-81bf-8e3a-0003e683b381/40bb16c1-fc04-4856-b9b4-a3b11f248013/%E6%88%AA%E5%B1%8F2026-02-19_%E4%B8%8B%E5%8D%882.24.19.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466YQULNCW4%2F20260220%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260220T111332Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEMv%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIC7m9tZlrbC6nQpjV5By2aZP5VGJeamuUcBpZogTfX8oAiBCKC67jsX2TSKkZzANLjMVcjTeVJVnhoDSIyV3HQ8LhyqIBAiU%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDYzNzQyMzE4MzgwNSIMnHQWL8a0%2FfYLYUWzKtwDaTgDztKYgtnzzZAiHkwIAQkl7Y4RAHMmS6nzySDluHmPyHLe3oSq09LorwokKYrkfTA1YNVitA3yG7SqrcY%2FEi4n%2BK85YM5dKQaYTHa5EHXyMUCJnV0k90WPQBek4PQ1kLHT1mXuC%2Fj8D1Uok9NloQ6r%2BuJKxtoFrPUVkjEg8nKUupAidOkY2Xzqsh79GTBGt9CIGTrpV9Ohmhbd%2FPwyzGWVEOPKRBMjEW37Cu8f85fhqVadjMMijZ8v9NPk%2FULRAuZCegeEpm%2F9mIFmTdOVFQficha17Emtcjbf05DdFkW%2FyyyUAAa8mGge%2FtPGp4wS5vLaLPgbWNHiFJLjI5K4Ju47DMxsetzwlwSFrBm1gkhnO1qPJ%2BdRpzem%2FqO4SFjT82MllLRDtZYpr%2BEE6L1jjJTEzHQsuxvYQbnkZQH0e4Dr4qjCzMwUSexvcI0dpTTo2PyxJBxUXe9HirWJMSDRwH8EXHQkJmd%2BJ0wO%2B2TgQ0Jsh4Tua1nacxtHL2R8WUJ402ZPNIIkBqmZmannca28EbtsLOZane9iJX1sIRTxRKmJLDFD2336uLQFi5VIyLWwqr7YoQ%2BN3aB9BOR8RzbQCUiKi%2FKmY8JWwHZGf6JrZHmaiSHynZ%2FKwvZyPqMw2e7gzAY6pgHfIK1DG75uzsW9lWryzjDo%2F5eec1u95AFVp5evyzmbzL%2BME91AVgFpJ7d7yTJDLFqxa%2Fb1JHYlphjfAkkzC2F1oRRr7v9nMEs0TlqkVzg6SGK%2F2o9MAr1IhyYbd3ysFwF9IepbfWTSRHiqyqRFQkyKXdRnd4EchikioZPysgoyoXd11ygH1%2BTSi02eQMEX4S%2BSl5R1%2BYQzMUrMlvuI39H13pGUHiQ3&X-Amz-Signature=b9992c1b3db3ad4f588103a8d8b1f0914e2af3ce9e833d4e63c1b6ed2d12c222&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject"
NEW_URL = "/images/elog/photo-REDACTED.png"

def main():
    if not os.path.exists(TARGET_FILE):
        return 0
    with open(TARGET_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    if OLD_URL not in content:
        return 0
    content = content.replace(OLD_URL, NEW_URL)
    with open(TARGET_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    return 0

if __name__ == "__main__":
    sys.exit(main())
