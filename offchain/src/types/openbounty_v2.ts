export type OpenbountyV2 = {
  address: "CdWRw7fqNCBpz34qHoFjua9Nry6pbhnVrsfpgMemKKrL";
  metadata: {
    name: "openbounty_v2";
    version: "0.1.0";
    spec: "0.1.0";
  };
  instructions: [
    {
      name: "initialize_escrow";
      accounts: [
        { name: "escrow"; writable: true; pda: object },
        { name: "vault"; writable: true; pda: object },
        { name: "organizer"; writable: true; signer: true },
        { name: "system_program"; address: "11111111111111111111111111111111" }
      ];
      args: [
        { name: "judges"; type: { vec: "pubkey" } },
        { name: "threshold"; type: "u8" },
        { name: "tier_amounts"; type: { vec: "u64" } },
        { name: "deadline"; type: "i64" }
      ];
    },
    {
      name: "finalize_winner";
      accounts: [
        { name: "escrow"; writable: true },
        { name: "organizer" }
      ];
      args: [
        { name: "tier"; type: "u8" },
        { name: "winner"; type: "pubkey" },
        { name: "judge_signatures"; type: { vec: { array: ["u8", 64] } } }
      ];
    },
    {
      name: "claim_prize";
      accounts: [
        { name: "escrow"; writable: true },
        { name: "vault"; writable: true; pda: object },
        { name: "winner"; writable: true; signer: true },
        { name: "system_program"; address: "11111111111111111111111111111111" }
      ];
      args: [{ name: "tier"; type: "u8" }];
    },
    {
      name: "refund_unclaimed";
      accounts: [
        { name: "escrow"; writable: true },
        { name: "vault"; writable: true; pda: object },
        { name: "organizer"; writable: true; signer: true },
        { name: "system_program"; address: "11111111111111111111111111111111" }
      ];
      args: [];
    }
  ];
  accounts: [{ name: "Escrow"; discriminator: number[] }];
  types: [
    {
      name: "Escrow";
      type: {
        kind: "struct";
        fields: [
          { name: "organizer"; type: "pubkey" },
          { name: "judges"; type: { vec: "pubkey" } },
          { name: "threshold"; type: "u8" },
          { name: "tiers"; type: { vec: { defined: { name: "PrizeTier" } } } },
          { name: "deadline"; type: "i64" },
          { name: "bump"; type: "u8" },
          { name: "vault_bump"; type: "u8" }
        ];
      };
    },
    {
      name: "PrizeTier";
      type: {
        kind: "struct";
        fields: [
          { name: "amount"; type: "u64" },
          { name: "winner"; type: { option: "pubkey" } },
          { name: "claimed"; type: "bool" }
        ];
      };
    }
  ];
  errors: [
    { code: 6000; name: "InvalidSignature"; msg: string },
    { code: 6001; name: "InsufficientSignatures"; msg: string },
    { code: 6002; name: "TierAlreadyClaimed"; msg: string },
    { code: 6003; name: "DeadlineNotReached"; msg: string },
    { code: 6004; name: "EscrowExpired"; msg: string },
    { code: 6005; name: "InvalidJudge"; msg: string },
    { code: 6006; name: "InvalidTier"; msg: string },
    { code: 6007; name: "InvalidThreshold"; msg: string },
    { code: 6008; name: "NoJudges"; msg: string },
    { code: 6009; name: "NoTiers"; msg: string },
    { code: 6010; name: "InvalidAmount"; msg: string },
    { code: 6011; name: "InvalidDeadline"; msg: string },
    { code: 6012; name: "Unauthorized"; msg: string },
    { code: 6013; name: "AlreadyFinalized"; msg: string },
    { code: 6014; name: "NotFinalized"; msg: string },
    { code: 6015; name: "InvalidMessage"; msg: string },
    { code: 6016; name: "DeadlineNotPassed"; msg: string },
    { code: 6017; name: "NoUnclaimedFunds"; msg: string }
  ];
};

// The IDL as a runtime constant — passed to new Program()
export const IDL: OpenbountyV2 = {
  address: "CdWRw7fqNCBpz34qHoFjua9Nry6pbhnVrsfpgMemKKrL",
  metadata: { name: "openbounty_v2", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "initialize_escrow",
      accounts: [
        {
          name: "escrow",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [101, 115, 99, 114, 111, 119] },
              { kind: "account", path: "organizer" },
            ],
          },
        },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [118, 97, 117, 108, 116] },
              { kind: "account", path: "organizer" },
            ],
          },
        },
        { name: "organizer", writable: true, signer: true },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        { name: "judges", type: { vec: "pubkey" } },
        { name: "threshold", type: "u8" },
        { name: "tier_amounts", type: { vec: "u64" } },
        { name: "deadline", type: "i64" },
      ],
    },
    {
      name: "finalize_winner",
      accounts: [
        { name: "escrow", writable: true },
        { name: "organizer" },
      ],
      args: [
        { name: "tier", type: "u8" },
        { name: "winner", type: "pubkey" },
        { name: "judge_signatures", type: { vec: { array: ["u8", 64] } } },
      ],
    },
    {
      name: "claim_prize",
      accounts: [
        { name: "escrow", writable: true },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [118, 97, 117, 108, 116] },
              {
                kind: "account",
                path: "escrow.organizer",
                account: "Escrow",
              },
            ],
          },
        },
        { name: "winner", writable: true, signer: true },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [{ name: "tier", type: "u8" }],
    },
    {
      name: "refund_unclaimed",
      accounts: [
        { name: "escrow", writable: true },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [118, 97, 117, 108, 116] },
              {
                kind: "account",
                path: "escrow.organizer",
                account: "Escrow",
              },
            ],
          },
        },
        { name: "organizer", writable: true, signer: true },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Escrow",
      discriminator: [31, 213, 123, 187, 186, 22, 218, 155],
    },
  ],
  types: [
    {
      name: "Escrow",
      type: {
        kind: "struct",
        fields: [
          { name: "organizer", type: "pubkey" },
          { name: "judges", type: { vec: "pubkey" } },
          { name: "threshold", type: "u8" },
          {
            name: "tiers",
            type: { vec: { defined: { name: "PrizeTier" } } },
          },
          { name: "deadline", type: "i64" },
          { name: "bump", type: "u8" },
          { name: "vault_bump", type: "u8" },
        ],
      },
    },
    {
      name: "PrizeTier",
      type: {
        kind: "struct",
        fields: [
          { name: "amount", type: "u64" },
          { name: "winner", type: { option: "pubkey" } },
          { name: "claimed", type: "bool" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "InvalidSignature", msg: "Signature verification failed" },
    { code: 6001, name: "InsufficientSignatures", msg: "Insufficient signatures - need more judge approvals" },
    { code: 6002, name: "TierAlreadyClaimed", msg: "This tier has already been claimed" },
    { code: 6003, name: "DeadlineNotReached", msg: "Deadline has not been reached yet" },
    { code: 6004, name: "EscrowExpired", msg: "Escrow has expired - claiming period is over" },
    { code: 6005, name: "InvalidJudge", msg: "Invalid judge - not in authorized judge list" },
    { code: 6006, name: "InvalidTier", msg: "Invalid tier index - tier does not exist" },
    { code: 6007, name: "InvalidThreshold", msg: "Threshold must be less than or equal to number of judges" },
    { code: 6008, name: "NoJudges", msg: "Must have at least one judge" },
    { code: 6009, name: "NoTiers", msg: "Must have at least one prize tier" },
    { code: 6010, name: "InvalidAmount", msg: "Amount must be greater than zero" },
    { code: 6011, name: "InvalidDeadline", msg: "Deadline must be in the future" },
    { code: 6012, name: "Unauthorized", msg: "Unauthorized - you are not the organizer" },
    { code: 6013, name: "AlreadyFinalized", msg: "Winner already finalized for this tier" },
    { code: 6014, name: "NotFinalized", msg: "Cannot claim - winner not yet finalized" },
    { code: 6015, name: "InvalidMessage", msg: "Message format invalid for signature verification" },
    { code: 6016, name: "DeadlineNotPassed", msg: "Deadline has not passed yet - cannot refund" },
    { code: 6017, name: "NoUnclaimedFunds", msg: "No unclaimed funds available to refund" },
  ],
};