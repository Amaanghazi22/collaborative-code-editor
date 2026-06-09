/**
 * Auth endpoint smoke tests.
 * These require a running Postgres DB. In CI, a service container
 * is configured in .github/workflows/ci.yml.
 *
 * Run locally:
 *   docker-compose up -d
 *   npm test
 */
import request from "supertest";
import { app } from "../server.js";

const uniqueSuffix = () => Math.random().toString(36).substring(2, 8);

describe("POST /api/auth/signup", () => {
  it("creates a new user and returns a token", async () => {
    const suffix = uniqueSuffix();
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        username: `testuser${suffix}`,
        email: `test${suffix}@example.com`,
        password: "Test1234",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("rejects duplicate email with 409", async () => {
    const suffix = uniqueSuffix();
    const payload = {
      username: `dup${suffix}`,
      email: `dup${suffix}@example.com`,
      password: "Test1234",
    };

    await request(app).post("/api/auth/signup").send(payload);
    const res = await request(app).post("/api/auth/signup").send(payload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects weak password with 400", async () => {
    const suffix = uniqueSuffix();
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        username: `weak${suffix}`,
        email: `weak${suffix}@example.com`,
        password: "short",
      });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns token on valid credentials", async () => {
    const suffix = uniqueSuffix();
    const payload = {
      username: `login${suffix}`,
      email: `login${suffix}@example.com`,
      password: "Login1234",
    };

    await request(app).post("/api/auth/signup").send(payload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it("returns 401 on wrong password", async () => {
    const suffix = uniqueSuffix();
    await request(app)
      .post("/api/auth/signup")
      .send({ username: `bad${suffix}`, email: `bad${suffix}@example.com`, password: "Good1234" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: `bad${suffix}@example.com`, password: "WrongPass1" });

    expect(res.status).toBe(401);
  });
});
