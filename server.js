/**
 *  RoboAudit v1.0.0 - An API for managing your LLM usage audits.
 *  ==========================================================
 *  This software is made available under the MIT license.
 *  ==========================================================
 *  Copyright © Ryan Noonan 2025
 */
const express = require("express");
const Sequelize = require("sequelize");
const { v4:uuidv4 } = require("uuid");
const { checkSchema, validationResult, matchedData } = require("express-validator");
let CONFIG = require("dotenv").config({"quiet": true});

// Parse .env
if (CONFIG.error) {
  console.log(CONFIG.error.message + "\n");
  console.log("Create a .env file with the following variables...");
  console.log("DATABASE_NAME=[DB_NAME_HERE]");
  console.log("DATABASE_USER=[DB_USER_HERE]");
  console.log("DATABASE_PASS=[DB_PASS_HERE]");
  console.log("DATABASE_HOST=[DB_HOST_HERE]");
  console.log("PORT=[SERVER_PORT_NUMBER]");

  // Wait for ctrl-c...
  while(1);
  process.exit();
}

CONFIG = CONFIG.parsed;

if (!CONFIG.DATABASE_NAME) {
  console.log("DATABASE_NAME not defined in .env file");

  // Wait for ctrl-c...
  while(1);
  process.exit();
}

if (!CONFIG.DATABASE_USER) {
  console.log("DATABASE_USER not defined in .env file");

  // Wait for ctrl-c...
  while(1);
  process.exit();
}

if (!CONFIG.DATABASE_PASS) {
  console.log("DATABASE_PASS not defined in .env file");

  // Wait for ctrl-c...
  while(1);
  process.exit();
}

if (!CONFIG.DATABASE_HOST) {
  console.log("DATABASE_HOST not defined in .env file");

  // Wait for ctrl-c...
  while(1);
  process.exit();
}

if (!CONFIG.PORT || (CONFIG.PORT && !parseInt(CONFIG.PORT))) {
  console.log("PORT not defined in .env file, or PORT is defined and is not a number");

  // Wait for ctrl-c...
  while(1);
  process.exit();
}

// Constants
const truthfulnessRatings = ["CORRECT", "MINOR_ERRORS", "MAJOR_ERRORS"];
const detailRatings = ["TOO_SHORT", "BALANCED", "TOO_LONG"];
const safetyRatings = ["SAFE", "UNSAFE"];
const qualityRatings = ["BAD", "OKAY", "GOOD", "EXCELLENT"];

// Middleware
function asyncExceptionHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch(e) {
      return res.status(500).send({
        "msg": "Oops, there was a problem trying to process your request. Please try again later.",
      });
    }
  }
}

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).send({
      "msg": "Request data improperly formatted!",
      "errors": errors.array(),
    });
  }

  req.formData = matchedData(req);
  next();
}

// Validators
function createAuditValidator() {
  return checkSchema({
    "prompt": {
      "in": ["body"],
      "trim": true,
      "escape": true,
      "isLength": {
        "options": {"min": 1},
        "errorMessage": "Prompt must not be empty!",
      },
    },
    "response": {
      "in": ["body"],
      "trim": true,
      "escape": true,
      "isLength": {
        "options": {"min": 1},
        "errorMessage": "Response must not be empty!",
      },
    },
    "truthfulness": {
      "in": ["body"],
      "trim": true,
      "isIn": {
        "options": [truthfulnessRatings],
        "errorMessage": "Invalid truthfulness rating!",
      },
    },
    "detail": {
      "in": ["body"],
      "trim": true,
      "isIn": {
        "options": [detailRatings],
        "errorMessage": "Invalid detail rating!",
      },
    },
    "safety": {
      "in": ["body"],
      "trim": true,
      "isIn": {
        "options": [safetyRatings],
        "errorMessage": "Invalid safety rating!",
      },
    },
    "quality": {
      "in": ["body"],
      "trim": true,
      "isIn": {
        "options": [qualityRatings],
        "errorMessage": "Invalid quality rating!",
      },
    },
  });
}

function editAuditValidator() {
  return checkSchema({
    "id": {
      "in": ["params"],
      "trim": true,
      "isUUID": {
        "value": 4,
        "errorMessage": "Not a valid id!",
      },
    },
    "truthfulness": {
      "in": ["body"],
      "optional": true,
      "trim": true,
      "isIn": {
        "options": [truthfulnessRatings],
        "errorMessage": "Invalid truthfulness rating!",
      },
    },
    "detail": {
      "in": ["body"],
      "optional": true,
      "trim": true,
      "isIn": {
        "options": [detailRatings],
        "errorMessage": "Invalid detail rating!",
      },
    },
    "safety": {
      "in": ["body"],
      "optional": true,
      "trim": true,
      "isIn": {
        "options": [safetyRatings],
        "errorMessage": "Invalid safety rating!",
      },
    },
    "quality": {
      "in": ["body"],
      "optional": true,
      "trim": true,
      "isIn": {
        "options": [qualityRatings],
        "errorMessage": "Invalid quality rating!",
      },
    },
  });
}

function deleteAuditValidator() {
  return checkSchema({
    "id": {
      "in": ["params"],
      "trim": true,
      "isUUID": {
        "value": 4,
        "errorMessage": "Not a valid id!",
      },
    },
  });
}

function fetchAuditValidator() {
  return checkSchema({
    "id": {
      "in": ["params"],
      "trim": true,
      "isUUID": {
        "value": 4,
        "errorMessage": "Not a valid id!",
      },
    },
  });
}

function fetchAuditsValidator() {
  return checkSchema({
    "offset": {
      "in": ["params"],
      "isInt": {
        "options": {"min": 0},
        "errorMessage": "Offset must be an integer >= 0!",
      },
    },
    "limit": {
      "in": ["params"],
      "isInt": {
        "options": {"min": 1},
        "errorMessage": "Limit must be an integer >= 1!",
      },
    },
  });
}

// DB models
const db = new Sequelize(
  CONFIG.DATABASE_NAME,
  CONFIG.DATABASE_USER,
  CONFIG.DATABASE_PASS,
  {
    "host": CONFIG.DATABASE_HOST,
    "dialect": "mysql",
    "logging": false,
  }
);

const AuditsModel = db.define("Audits", {
  "id": {
    "type": Sequelize.DataTypes.STRING(36),
    "primaryKey": true,
    "allowNull": false,
  },
  "prompt": {
    "type": Sequelize.DataTypes.BLOB,
    "allowNull": false,
  },
  "response": {
    "type": Sequelize.DataTypes.BLOB,
    "allowNull": false,
  },
});

AuditsModel.addHook("afterFind", (result) => {
  if (Array.isArray(result)) 
  {
    result.forEach((item) => {
      if (item.prompt)
        item.prompt = item.prompt.toString("utf-8");
      if (item.response)
        item.response = item.response.toString("utf-8");
    });
  } 
  else if (result !== null && typeof result === "object") 
  {
    if (result.prompt)
      result.prompt = result.prompt.toString("utf-8");
    if (result.response)
      result.response = result.response.toString("utf-8");
  }
});

const RubricRatingsModel = db.define("RubricRatings", {
  "audit_id": {
    "type": Sequelize.DataTypes.STRING(36),
    "primaryKey": true,
    "allowNull": false,
  },
  "truthfulness": {
    "type": Sequelize.DataTypes.ENUM(truthfulnessRatings),
    "allowNull": false,
  },
  "detail": {
    "type": Sequelize.DataTypes.ENUM(detailRatings),
    "allowNull": false,
  },
  "safety": {
    "type": Sequelize.DataTypes.ENUM(safetyRatings),
    "allowNull": false,
  },
  "quality": {
    "type": Sequelize.DataTypes.ENUM(qualityRatings),
    "allowNull": false,
  },
});

AuditsModel.hasOne(RubricRatingsModel, {"foreignKey": "audit_id"});

(async function() {

  // Connect and sync DB
  await db.authenticate();
  await db.sync({"alter": true});

  // API
  const app = express();
  app.use(express.json());
  
  app.get("/audits/:offset/:limit", fetchAuditsValidator(), validate, asyncExceptionHandler(async (req, res) => {
    const {
      offset,
      limit,
    } = req.formData;

    const audits = await AuditsModel.findAll({
      "include": [
        {
          "model": RubricRatingsModel,
          "attributes": {
            "exclude": ["audit_id"],
          },
        },
      ],
      "offset": parseInt(offset),
      "limit": parseInt(limit),
    });

    if (audits.length === 0)
      return res.status(404).send({"msg": "No audits found!"});

    const totalAudits = await AuditsModel.count();

    return res.status(200).send({
      "msg": "Found audits!",
      "data": audits,
      "total_audits": totalAudits,
    });
  }));


  app.get("/audit/:id", fetchAuditValidator(), validate, asyncExceptionHandler(async (req,res) => {
    const auditId = req.formData.id;

    const audit = await AuditsModel.findOne({
      "where": {
        "id": auditId,
      },
      "include": [
        {
          "model": RubricRatingsModel,
          "attributes": {
            "exclude": ["audit_id"],
          },
        },
      ],
    });

    if (!audit)
      return res.status(404).send({"msg": "Audit not found!"});

    return res.status(200).send({
      "msg": "Found audit!",
      "data": audit,
    });
  }));


  app.post("/audit", createAuditValidator(), validate, asyncExceptionHandler(async (req, res) => {
    const {
      prompt,
      response,
      truthfulness,
      detail,
      safety,
      quality,
    } = req.formData;

    const auditId = uuidv4();

    const tx = await db.transaction();

    try {
      await AuditsModel.create(
        {
          "id": auditId,
          "prompt": prompt,
          "response": response,
        },
        {
          "transaction": tx,
        }
      );

      await RubricRatingsModel.create(
        {
          "audit_id": auditId,
          "truthfulness": truthfulness,
          "detail": detail,
          "safety": safety,
          "quality": quality,
        },
        {
          "transaction": tx
        }
      );

      await tx.commit();
    } catch(e) {
      await tx.rollback();
      throw e;
    }

    return res.status(200).send({
      "msg": "Successfully created audit!",
      "data": {
        "id": auditId,
        "prompt": prompt,
        "response": response,
        "RubricRating": {
          "truthfulness": truthfulness,
          "detail": detail,
          "safety": safety,
          "quality": quality,
        },
      },
    });
  }));

  app.patch("/audit/:id", editAuditValidator(), validate, asyncExceptionHandler(async (req, res) => {
    const auditId = req.formData.id;

    // Check if audit exists
    const audit = await RubricRatingsModel.findOne({
      "where": {
        "audit_id": auditId,
      },
    });

    if (!audit)
      return res.status(404).send({"msg": "Audit does not exist!"});

    delete req.formData.id;
    await RubricRatingsModel.update(
      req.formData,
      {
        "where": {
          "audit_id": auditId,
        },
      },
    );

    return res.status(200).send({
      "msg": "Successfully updated audit ratings!",
      "data": req.formData,
    });
  }));

  app.delete("/audit/:id", deleteAuditValidator(), validate, asyncExceptionHandler(async (req, res) => {
    const auditId = req.formData.id;

    // Check audit exists
    const audit = await AuditsModel.findOne({
      "where": {
        "id": auditId,
      },
    });

    if (!audit)
      return res.status(404).send({"msg": "Audit does not exist!"});

    const tx = await db.transaction();

    try {
      await RubricRatingsModel.destroy(
        {
          "where": {
            "audit_id": auditId
          },
        },
        {
          "transaction": tx,
        }
      );

      await AuditsModel.destroy(
        {
          "where": {
            "id": auditId,
          },
        },
        {
          "transaction": tx,
        }
      );

      await tx.commit();

    } catch(e) {
      await tx.rollback();
      throw e;
    }

    return res.status(200).send({
      "msg": "Successfully deleted audit!",
      "data": {
        "id": auditId,
      },
    });

  }));


  app.listen(
    parseInt(CONFIG.PORT),
    () => {
      console.log(
          "RoboAudit v1.0.0 - An API for managing your LLM usage audits.\n" +
          "==========================================================\n" +
          "This software is made available under the MIT license.\n" +
          "==========================================================\n" +
          "Copyright © Ryan Noonan 2025\n" +
          "==========================================================\n\n" +
          `Server started at ${(new Date()).toUTCString()}\n` +
          `Listening on port: ${CONFIG.PORT}`
      );
    }
  );
})();

