import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- MOCK DATABASE ---
  let survivors = [
    {
      id: 1,
      full_name: "Joel Miller",
      age: 45,
      profession_id: 1,
      profession_name: "Hunter",
      status: "HEALTHY",
      camp_id: 1,
    },
    {
      id: 2,
      full_name: "Ellie Williams",
      age: 19,
      profession_id: 2,
      profession_name: "Scout",
      status: "HEALTHY",
      camp_id: 1,
    },
  ];

  let camps = [
    {
      id: 1,
      name: "Jackson Refuge",
      location: "Wyoming",
      status: "ACTIVE",
      ai_context_prompt: "Focus on community and defense.",
    },
    {
      id: 2,
      name: "Boston QZ",
      location: "Massachusetts",
      status: "ACTIVE",
      ai_context_prompt: "Strict military control.",
    },
  ];

  let resources = [
    {
      id: 1,
      name: "Canned Food",
      unit: "cans",
      daily_ration: 0.5,
      minimum_stock: 50,
      auto_daily: true,
    },
    {
      id: 2,
      name: "Water",
      unit: "liters",
      daily_ration: 2,
      minimum_stock: 100,
      auto_daily: true,
    },
    {
      id: 3,
      name: "9mm Ammo",
      unit: "rounds",
      daily_ration: 0,
      minimum_stock: 200,
      auto_daily: false,
    },
  ];

  let inventory = [
    { camp_id: 1, resource_id: 1, quantity: 120 },
    { camp_id: 1, resource_id: 2, quantity: 45 },
    { camp_id: 1, resource_id: 3, quantity: 1500 },
  ];

  let inventoryLogs = [
    {
      id: 1,
      camp_id: 1,
      resource_id: 1,
      quantity_change: 120,
      log_type: "MANUAL_IN",
      logged_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      description: "Initial storage cargo setup",
    },
    {
      id: 2,
      camp_id: 1,
      resource_id: 2,
      quantity_change: 45,
      log_type: "MANUAL_IN",
      logged_at: new Date(Date.now() - 3600000).toISOString(),
      description: "Jackson reservoir link check",
    },
    {
      id: 3,
      camp_id: 1,
      resource_id: 3,
      quantity_change: 1500,
      log_type: "MANUAL_IN",
      logged_at: new Date(Date.now() - 1800000).toISOString(),
      description: "Outer-limit ammunition drop",
    },
  ];

  let admissions = [
    {
      id: 1,
      camp_id: 1,
      full_name: "Dina",
      age: 19,
      status: "PENDING",
      ai_analysis: "High emotional intelligence. Skilled in logistics.",
      created_at: new Date().toISOString(),
    },
  ];

  let expeditions: Array<{
    id: number;
    camp_id: number;
    title: string;
    status: string;
    destination: string;
    departure_date: string;
    expected_return_date?: string;
    max_return_date?: string;
    actual_return_date?: string;
    notes: string;
  }> = [
    {
      id: 1,
      camp_id: 1,
      title: "Downtown Scavenging",
      status: "ONGOING",
      destination: "Old Mall",
      departure_date: new Date().toISOString(),
      expected_return_date: new Date(Date.now() + 86400000).toISOString(),
      max_return_date: new Date(Date.now() + 172800000).toISOString(),
      notes: "Initial scout dispatch near old shopping center.",
    },
  ];

  // --- AUTH ROUTES ---
  app.post("/api/auth/login", (req, res) => {
    const { username } = req.body;
    const role =
      username === "admin"
        ? "system_admin"
        : username === "manager"
          ? "resource_manager"
          : username === "travel" || username === "coordinator"
            ? "travel_coordinator"
            : "survivor";
    res.json({
      user: { username, role, camp_id: 1 },
      token: "mock-jwt-token",
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // --- SYSTEM ROUTES ---
  app.get("/api/system/time", (req, res) => {
    const now = new Date();
    res.json({
      now: now.toTimeString().split(" ")[0],
      iso: now.toISOString(),
      today: now.toISOString().split("T")[0],
    });
  });

  // --- CAMP ROUTES ---
  app.get("/api/camps", (req, res) => res.json(camps));
  app.get("/api/camps/:id", (req, res) =>
    res.json(camps.find((c) => c.id == Number(req.params.id))),
  );

  app.post("/api/camps", (req, res) => {
    const { name, location, status, ai_context_prompt } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Camp name is required" });
    }
    const newCamp = {
      id: camps.length + 1,
      name,
      location: location || "Unknown Sector",
      status: status || "ACTIVE",
      ai_context_prompt:
        ai_context_prompt ||
        "Establish defensive parameters & optimize starvation metrics.",
    };
    camps.push(newCamp);

    // Initialize zero inventories for all standard resources for the new camp
    resources.forEach((r) => {
      inventory.push({ camp_id: newCamp.id, resource_id: r.id, quantity: 100 });
      inventoryLogs.push({
        id: inventoryLogs.length + 1,
        camp_id: newCamp.id,
        resource_id: r.id,
        quantity_change: 100,
        log_type: "MANUAL_IN",
        logged_at: new Date().toISOString(),
        description: `Automatic initialization of stock for refuge ${newCamp.name}`,
      });
    });

    res.status(201).json(newCamp);
  });

  app.patch("/api/camps/:id", (req, res) => {
    const campId = Number(req.params.id);
    const camp = camps.find((c) => c.id === campId);
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }
    const { name, location, status, ai_context_prompt } = req.body;
    if (name !== undefined) camp.name = name;
    if (location !== undefined) camp.location = location;
    if (status !== undefined) camp.status = status;
    if (ai_context_prompt !== undefined)
      camp.ai_context_prompt = ai_context_prompt;
    res.json(camp);
  });

  // --- METRICS ROUTES ---
  app.get("/api/metrics/dashboard", (req, res) => {
    const campId = Number(req.query.campId) || 1;
    res.json({
      survivor_count: survivors.filter((s) => s.camp_id === campId).length,
      active_expeditions_count: expeditions.filter(
        (e) => e.camp_id === campId && e.status === "ACTIVE",
      ).length,
      low_resource_alerts_count: inventory.filter(
        (i) =>
          i.camp_id === campId &&
          i.quantity <
            (resources.find((r) => r.id === i.resource_id)?.minimum_stock || 0),
      ).length,
      pending_transfers_count: admissions.filter(
        (a) => a.camp_id === campId && a.status === "PENDING",
      ).length,
    });
  });

  app.get("/api/metrics/resources", (req, res) => {
    const campId = Number(req.query.campId) || 1;
    const survivorCount = survivors.filter((s) => s.camp_id === campId).length;
    const data = resources.map((r) => {
      const inv = inventory.find(
        (i) => i.camp_id === campId && i.resource_id === r.id,
      );
      const qty = inv?.quantity || 0;
      const dailyUsage = r.daily_ration * survivorCount;
      const projection = dailyUsage > 0 ? Math.floor(qty / dailyUsage) : null;

      return {
        resource_id: r.id,
        resource_name: r.name,
        unit: r.unit,
        quantity: qty,
        minimum_stock: r.minimum_stock,
        daily_ration: r.daily_ration,
        daily_usage: dailyUsage,
        projection_days: projection,
        status:
          qty < r.minimum_stock
            ? qty < r.minimum_stock / 2
              ? "CRITICAL"
              : "LOW"
            : "OPTIMAL",
      };
    });
    res.json(data);
  });

  // --- INVENTORY ADJUSTMENT & AUDIT TRAILS ---
  app.get("/api/inventory/audit/:campId", (req, res) => {
    const campId = Number(req.params.campId);
    const logs = inventoryLogs
      .filter((log) => log.camp_id === campId)
      .map((log) => {
        const resType = resources.find((r) => r.id === log.resource_id);
        return {
          ...log,
          resource_name: resType?.name || "Unknown Resource",
          unit: resType?.unit || "units",
        };
      })
      .reverse(); // Newest first
    res.json(logs);
  });

  app.post("/api/inventory/adjustment", (req, res) => {
    const {
      camp_id,
      resource_type_id,
      resource_id,
      type,
      quantity,
      description,
    } = req.body;
    const resolvedCampId = Number(camp_id) || 1;
    const resolvedResourceId = Number(resource_type_id || resource_id);
    const resolvedQty = Number(quantity);

    if (!resolvedResourceId || isNaN(resolvedQty)) {
      return res
        .status(400)
        .json({ error: "resource_id and quantity are required" });
    }

    let inv = inventory.find(
      (i) =>
        i.camp_id === resolvedCampId && i.resource_id === resolvedResourceId,
    );
    if (!inv) {
      inv = {
        camp_id: resolvedCampId,
        resource_id: resolvedResourceId,
        quantity: 0,
      };
      inventory.push(inv);
    }

    const change = type === "MANUAL_IN" ? resolvedQty : -resolvedQty;
    inv.quantity = Math.max(0, inv.quantity + change);

    const newLog = {
      id: inventoryLogs.length + 1,
      camp_id: resolvedCampId,
      resource_id: resolvedResourceId,
      quantity_change: change,
      log_type: type || "MANUAL_IN",
      logged_at: new Date().toISOString(),
      description: description || `Manual adjustment of ${resolvedQty} units`,
    };

    inventoryLogs.push(newLog);

    res.status(201).json({
      ...newLog,
      resource_name:
        resources.find((r) => r.id === resolvedResourceId)?.name ||
        "Unknown Resource",
    });
  });

  // --- PEOPLE ROUTES ---
  app.get("/api/camps/:campId/people", (req, res) => {
    res.json({
      data: survivors.filter((s) => s.camp_id == Number(req.params.campId)),
      total: survivors.length,
    });
  });

  app.put("/api/people/:id", (req, res) => {
    const { full_name, status, age, profession_id, profession_name } = req.body;
    const person = survivors.find((s) => s.id == Number(req.params.id));
    if (person) {
      if (full_name !== undefined) person.full_name = full_name;
      if (status !== undefined) person.status = status;
      if (age !== undefined) person.age = Number(age);
      if (profession_name !== undefined)
        person.profession_name = profession_name;
      res.json({ message: "Update successful", person });
    } else {
      res.status(404).json({ message: "Person not found" });
    }
  });

  app.put("/api/camps/:campId/people/:id", (req, res) => {
    const { full_name, status, age, profession_id, profession_name } = req.body;
    const person = survivors.find((s) => s.id == Number(req.params.id));
    if (person) {
      if (full_name !== undefined) person.full_name = full_name;
      if (status !== undefined) person.status = status;
      if (age !== undefined) person.age = Number(age);
      if (profession_name !== undefined)
        person.profession_name = profession_name;
      res.json({ message: "Update successful", person });
    } else {
      res.status(404).json({ message: "Person not found" });
    }
  });

  app.delete("/api/people/:id", (req, res) => {
    const idx = survivors.findIndex((s) => s.id == Number(req.params.id));
    if (idx !== -1) {
      const removed = survivors.splice(idx, 1);
      res.json({ message: "Person deleted successfully", person: removed[0] });
    } else {
      res.status(404).json({ message: "Person not found" });
    }
  });

  app.delete("/api/camps/:campId/people/:id", (req, res) => {
    const idx = survivors.findIndex((s) => s.id == Number(req.params.id));
    if (idx !== -1) {
      const removed = survivors.splice(idx, 1);
      res.json({ message: "Person deleted successfully", person: removed[0] });
    } else {
      res.status(404).json({ message: "Person not found" });
    }
  });

  app.post("/api/people/:id/transfer", (req, res) => {
    const { target_camp_id } = req.body;
    const person = survivors.find((s) => s.id == Number(req.params.id));
    if (person) {
      person.camp_id = Number(target_camp_id);
      res.json({ message: "Transfer successful", person });
    } else {
      res.status(404).json({ message: "Person not found" });
    }
  });

  // --- ADMISSION ROUTES ---
  app.get("/api/admission/camps/:campId", (req, res) => {
    res.json(admissions.filter((a) => a.camp_id == Number(req.params.campId)));
  });

  app.get("/api/admission/:id", (req, res) => {
    const adm: any = admissions.find((a) => a.id == Number(req.params.id));
    if (!adm) {
      return res.status(404).json({ error: "Admission not found" });
    }
    res.json({
      ...adm,
      details: adm.details || {
        age: adm.age || 25,
        medical_data: "Excellent",
        skills: "Archery, First Aid",
        reasoning: adm.ai_analysis || "Strong addition to the perimeter guard.",
      },
    });
  });

  app.post("/api/admission/camps/:campId", (req, res) => {
    const campId = Number(req.params.campId);
    const {
      applicant_name,
      applicant_age,
      applicant_skills,
      health_notes,
      background_notes,
      photo_url,
      id_card_url,
    } = req.body;

    if (!applicant_name) {
      return res.status(400).json({
        error: { message: "applicant_name is required", statusCode: 400 },
      });
    }

    // Simulate stability AI screening
    const skillsLower = (applicant_skills || "").toLowerCase();
    const bgLower = (background_notes || "").toLowerCase();

    let ai_decision: "ACCEPTED" | "PENDING" | "REJECTED" = "PENDING";
    let ai_suggested_profession = "Auxiliary Personnel";
    let ai_profession_id = 5;
    let ai_reasoning =
      "Standard screening complete. No active security locks. Recommend immediate validation checkpoint intake.";

    if (
      skillsLower.includes("combat") ||
      bgLower.includes("military") ||
      skillsLower.includes("defense") ||
      skillsLower.includes("weapon") ||
      bgLower.includes("guard")
    ) {
      ai_decision = "ACCEPTED";
      ai_suggested_profession = "Defense Sentinel";
      ai_profession_id = 1;
      ai_reasoning =
        "Exceptional tactical profile. Recommended assignment to outer defense grid limits.";
    } else if (
      skillsLower.includes("medical") ||
      skillsLower.includes("first aid") ||
      skillsLower.includes("nurse") ||
      skillsLower.includes("doctor") ||
      skillsLower.includes("surgeon")
    ) {
      ai_decision = "ACCEPTED";
      ai_suggested_profession = "Field Medic";
      ai_profession_id = 3;
      ai_reasoning =
        "Critical bio-medical attributes detected. Clinician deficiency identified in selected sector.";
    } else if (
      skillsLower.includes("farming") ||
      skillsLower.includes("cultivation") ||
      skillsLower.includes("agriculture") ||
      skillsLower.includes("botany") ||
      skillsLower.includes("grow")
    ) {
      ai_decision = "ACCEPTED";
      ai_suggested_profession = "Hydroponics Tech";
      ai_profession_id = 4;
      ai_reasoning =
        "Sustenance logistics match. Key agrarian skillset for long-term community metabolic survival.";
    } else if (
      skillsLower.includes("scavenge") ||
      skillsLower.includes("scout") ||
      skillsLower.includes("find") ||
      skillsLower.includes("gather")
    ) {
      ai_decision = "ACCEPTED";
      ai_suggested_profession = "Sector Scout";
      ai_profession_id = 2;
      ai_reasoning =
        "Optimal metabolic resilience & high athletic score. Asset-finding capabilities approved.";
    } else if (
      health_notes &&
      (health_notes.toLowerCase().includes("infected") ||
        health_notes.toLowerCase().includes("bite") ||
        health_notes.toLowerCase().includes("coughingblood"))
    ) {
      ai_decision = "REJECTED";
      ai_suggested_profession = "Auxiliary Personnel";
      ai_profession_id = 5;
      ai_reasoning =
        "Critical risk: potential viral mutation detected. Deny entry under quarantine protocols.";
    }

    const newId = admissions.length + 1;
    const newAdmission = {
      id: newId,
      camp_id: campId,
      full_name: applicant_name,
      applicant_name,
      applicant_age: Number(applicant_age) || 25,
      age: Number(applicant_age) || 25,
      ai_analysis: ai_reasoning,
      applicant_skills,
      health_notes,
      background_notes,
      photo_url:
        photo_url ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
      id_card_url:
        id_card_url ||
        "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=400&h=250&q=80",
      ai_decision,
      ai_reasoning,
      ai_confidence: 0.94,
      ai_suggested_profession,
      ai_profession_id,
      final_decision: "PENDING",
      status: "PENDING",
      created_at: new Date().toISOString(),
      details: {
        age: Number(applicant_age) || 25,
        medical_data: health_notes || "NOMINAL STATE - PASSIVE SYSTEM",
        skills: applicant_skills || "General auxiliary labor suitability",
        reasoning: ai_reasoning,
        suggested_profession: ai_suggested_profession,
        ai_decision: ai_decision,
        background: background_notes || "Relocating from outside Sector 04",
      },
    };

    admissions.push(newAdmission);
    res.status(201).json(newAdmission);
  });

  app.patch("/api/admission/:id/review", (req, res) => {
    const {
      status,
      final_decision,
      corrected_profession_id,
      correction_reason,
    } = req.body;
    const resolvedStatus = final_decision || status;
    const adm = admissions.find((a) => a.id == Number(req.params.id));
    if (adm) {
      const decision =
        resolvedStatus === "APPROVED" || resolvedStatus === "ACCEPTED"
          ? "APPROVED"
          : "REJECTED";
      adm.status = decision;
      (adm as any).final_decision =
        decision === "APPROVED" ? "ACCEPTED" : "REJECTED";

      if (decision === "APPROVED") {
        const professions = [
          { id: 1, name: "Defense Sentinel" },
          { id: 2, name: "Sector Scout" },
          { id: 3, name: "Field Medic" },
          { id: 4, name: "Hydroponics Tech" },
          { id: 5, name: "Auxiliary Personnel" },
        ];

        let profId = corrected_profession_id
          ? Number(corrected_profession_id)
          : (adm as any).ai_profession_id || 5;
        let prof = professions.find((p) => p.id === profId) || professions[4];

        survivors.push({
          id: survivors.length + 1,
          full_name: adm.full_name,
          age: (adm as any).applicant_age || adm.age || 25,
          profession_id: prof.id,
          profession_name: prof.name,
          status: "HEALTHY",
          camp_id: adm.camp_id,
        });
      }
    }
    res.json({ message: "Review completed" });
  });

  // --- EXPEDITION ROUTES ---
  app.get("/api/expeditions", (req, res) => {
    const campId = Number(req.query.campId);
    if (campId) {
      return res.json(expeditions.filter((e) => e.camp_id === campId));
    }
    res.json(expeditions);
  });

  app.put("/api/expeditions/:id", (req, res) => {
    const {
      status,
      destination,
      departure_date,
      expected_return_date,
      max_return_date,
      actual_return_date,
      notes,
    } = req.body;
    const exp = expeditions.find((e) => e.id == Number(req.params.id));
    if (exp) {
      if (status !== undefined) exp.status = status;
      if (destination !== undefined) {
        exp.destination = destination;
        exp.title = destination;
      }
      if (departure_date !== undefined) exp.departure_date = departure_date;
      if (expected_return_date !== undefined) {
        exp.expected_return_date = expected_return_date;
      }
      if (max_return_date !== undefined) exp.max_return_date = max_return_date;
      if (actual_return_date !== undefined) {
        exp.actual_return_date = actual_return_date;
      }
      if (notes !== undefined) exp.notes = notes;
      res.json({ message: "Expedition updated", expedition: exp });
    } else {
      res.status(404).json({ message: "Expedition not found" });
    }
  });

  app.patch("/api/expeditions/:id/status", (req, res) => {
    const { status, actual_return_date, notes } = req.body;
    const exp = expeditions.find((e) => e.id == Number(req.params.id));

    if (!exp) {
      return res.status(404).json({ message: "Expedition not found" });
    }

    if (status !== undefined) exp.status = status;
    if (actual_return_date !== undefined) {
      exp.actual_return_date = actual_return_date;
    }
    if (notes !== undefined) exp.notes = notes;

    res.json({ message: "Expedition status updated", expedition: exp });
  });

  app.delete("/api/expeditions/:id", (req, res) => {
    const idx = expeditions.findIndex((e) => e.id == Number(req.params.id));
    if (idx !== -1) {
      const removed = expeditions.splice(idx, 1);
      res.json({ message: "Expedition deleted", expedition: removed[0] });
    } else {
      res.status(404).json({ message: "Expedition not found" });
    }
  });

  app.post("/api/expeditions", (req, res) => {
    const {
      camp_id,
      destination,
      departure_date,
      expected_return_date,
      max_return_date,
      status,
      notes,
    } = req.body;

    if (!destination) {
      return res.status(400).json({ error: "destination is required" });
    }

    const newId = expeditions.length + 1;
    const newExp = {
      id: newId,
      camp_id: Number(camp_id) || 1,
      title: destination,
      destination,
      status: status || "PLANNED",
      departure_date: departure_date || new Date().toISOString().split("T")[0],
      expected_return_date,
      max_return_date,
      notes: notes || "Scavenging squad deployed",
    };

    expeditions.push(newExp);
    res.status(201).json(newExp);
  });

  // --- Remote API Proxy (avoids CORS when using the Railway production backend) ---
  // All requests to /api-remote/* are forwarded server-side to the Railway API,
  // so the browser never makes a cross-origin request.
  const REMOTE_API =
    "https://gestion-del-fin-api-production.up.railway.app/api";

  app.all("/api-remote/*", async (req, res) => {
    const suffix = req.path.replace(/^\/api-remote/, "");
    const querySuffix = req.url.includes("?")
      ? "?" + req.url.split("?")[1]
      : "";
    const targetUrl = `${REMOTE_API}${suffix}${querySuffix}`;
    const method = req.method.toUpperCase();
    const contentType = req.headers["content-type"];
    const isMultipart =
      typeof contentType === "string" &&
      contentType.includes("multipart/form-data");

    const makeRequest = (url: string, requestMethod: string, data?: any) =>
      axios({
        method: requestMethod as any,
        url,
        data,
        headers: {
          ...(req.headers["authorization"]
            ? { Authorization: req.headers["authorization"] }
            : {}),
          ...(typeof contentType === "string"
            ? { "Content-Type": contentType }
            : {}),
          ...(isMultipart && typeof req.headers["content-length"] === "string"
            ? { "Content-Length": req.headers["content-length"] }
            : {}),
        },
        validateStatus: () => true,
        maxBodyLength: Infinity,
      });

    try {
      let response = await makeRequest(
        targetUrl,
        method,
        ["GET", "HEAD"].includes(method)
          ? undefined
          : isMultipart
            ? req
            : req.body,
      );

      if (
        response.status === 404 &&
        method === "PATCH" &&
        /^\/api-remote\/expeditions\/\d+\/status$/.test(req.path)
      ) {
        response = await makeRequest(
          `${REMOTE_API}${suffix.replace(/\/status$/, "")}${querySuffix}`,
          "PUT",
          {
            status: req.body?.status,
            actual_return_date: req.body?.actual_return_date,
            notes: req.body?.notes,
          },
        );
      }

      if (response.status === 204) {
        return res.status(204).send();
      }

      if (typeof response.data === "string") {
        return res.status(response.status).send(response.data);
      }

      res.status(response.status).json(response.data);
    } catch (err: any) {
      res.status(502).json({ error: "Proxy error", detail: err.message });
    }
  });

  // --- Vite Setup ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Survivor Server running on http://localhost:${PORT}`);
  });
}

startServer();
