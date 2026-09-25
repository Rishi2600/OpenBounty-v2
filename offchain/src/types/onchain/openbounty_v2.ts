/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/openbounty_v2.json`.
 */
export type OpenbountyV2 = {
  "address": "CdWRw7fqNCBpz34qHoFjua9Nry6pbhnVrsfpgMemKKrL",
  "metadata": {
    "name": "openbountyV2",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimPrize",
      "docs": [
        "Winner claims their prize for a finalized tier",
        "Closes escrow when all tiers are claimed"
      ],
      "discriminator": [
        157,
        233,
        139,
        121,
        246,
        62,
        234,
        235
      ],
      "accounts": [
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "winner",
          "docs": [
            "The winner claiming their prize — must match tier.winner"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "organizer",
          "docs": [
            "Organizer receives rent when escrow closes"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u8"
        },
        {
          "name": "tier",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initializeEscrow",
      "docs": [
        "Create a new bounty escrow and lock funds",
        "nonce allows the same wallet to create multiple escrows"
      ],
      "discriminator": [
        243,
        160,
        77,
        153,
        11,
        92,
        48,
        209
      ],
      "accounts": [
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "organizer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "metadataUri",
          "type": "string"
        },
        {
          "name": "judges",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "threshold",
          "type": "u8"
        },
        {
          "name": "tierAmounts",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "deadline",
          "type": "i64"
        },
        {
          "name": "nonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "refundUnclaimed",
      "docs": [
        "Organizer refunds unclaimed prizes after deadline",
        "Closes escrow after refunding"
      ],
      "discriminator": [
        126,
        143,
        204,
        210,
        179,
        143,
        2,
        231
      ],
      "accounts": [
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "organizer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "voteWinner",
      "docs": [
        "Judge casts a vote for a winner on a specific tier",
        "Auto-finalizes when vote count reaches threshold"
      ],
      "discriminator": [
        44,
        247,
        50,
        25,
        60,
        91,
        248,
        84
      ],
      "accounts": [
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "judge",
          "docs": [
            "The judge casting this vote — must be in escrow.judges"
          ],
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u8"
        },
        {
          "name": "tier",
          "type": "u8"
        },
        {
          "name": "candidate",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "discriminator": [
        31,
        213,
        123,
        187,
        186,
        22,
        218,
        155
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidSignature",
      "msg": "Invalid signature provided"
    },
    {
      "code": 6001,
      "name": "insufficientSignatures",
      "msg": "Insufficient signatures to meet threshold"
    },
    {
      "code": 6002,
      "name": "tierAlreadyClaimed",
      "msg": "This tier has already been claimed"
    },
    {
      "code": 6003,
      "name": "deadlineNotReached",
      "msg": "The deadline has not been reached yet"
    },
    {
      "code": 6004,
      "name": "escrowExpired",
      "msg": "This escrow has expired"
    },
    {
      "code": 6005,
      "name": "invalidJudge",
      "msg": "Invalid judge provided"
    },
    {
      "code": 6006,
      "name": "invalidTier",
      "msg": "Invalid tier index"
    },
    {
      "code": 6007,
      "name": "invalidThreshold",
      "msg": "Invalid threshold"
    },
    {
      "code": 6008,
      "name": "noJudges",
      "msg": "No judges provided"
    },
    {
      "code": 6009,
      "name": "noTiers",
      "msg": "No tiers provided"
    },
    {
      "code": 6010,
      "name": "invalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6011,
      "name": "invalidDeadline",
      "msg": "Invalid deadline"
    },
    {
      "code": 6012,
      "name": "unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6013,
      "name": "alreadyFinalized",
      "msg": "This tier has already been finalized"
    },
    {
      "code": 6014,
      "name": "notFinalized",
      "msg": "This tier has not been finalized yet"
    },
    {
      "code": 6015,
      "name": "invalidMessage",
      "msg": "Invalid message"
    },
    {
      "code": 6016,
      "name": "deadlineNotPassed",
      "msg": "Deadline has not passed yet"
    },
    {
      "code": 6017,
      "name": "noUnclaimedFunds",
      "msg": "No unclaimed funds to refund"
    },
    {
      "code": 6018,
      "name": "invalidTitle",
      "msg": "Title is empty or exceeds 50 characters"
    },
    {
      "code": 6019,
      "name": "invalidMetadataUri",
      "msg": "Metadata URI exceeds 100 characters"
    },
    {
      "code": 6020,
      "name": "alreadyVoted",
      "msg": "This judge has already voted on this tier"
    },
    {
      "code": 6021,
      "name": "notAJudge",
      "msg": "Signer is not a judge on this escrow"
    },
    {
      "code": 6022,
      "name": "tierAlreadyFinalized",
      "msg": "This tier has already been finalized and cannot receive more votes"
    }
  ],
  "types": [
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "metadataUri",
            "type": "string"
          },
          {
            "name": "organizer",
            "type": "pubkey"
          },
          {
            "name": "nonce",
            "type": "u8"
          },
          {
            "name": "judges",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "threshold",
            "type": "u8"
          },
          {
            "name": "tiers",
            "type": {
              "vec": {
                "defined": {
                  "name": "prizeTier"
                }
              }
            }
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "prizeTier",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "votes",
            "type": {
              "vec": {
                "defined": {
                  "name": "tierVote"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "tierVote",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "judge",
            "type": "pubkey"
          },
          {
            "name": "candidate",
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
