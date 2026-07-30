# V19.9.7.1 — Multi-Identity Rule Precedence

- Corrected BOA-196 Vampire Bats to use `Army` as its primary card type.
- Retained both `Army` and `Animal` in its `types` and `characteristics` collections.
- Conceal checks now recognize identities from both Types and Characteristics.
- Restrictive Army rules take precedence: a card that is both Army and Animal cannot be played concealed or concealed by an effect.
- Character and Animal cards remain naturally concealable when they are not also Armies.
