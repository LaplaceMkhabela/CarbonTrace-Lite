// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20 <0.9.0;

/// @title CarbonTrace Credits (CTC)
/// @notice A verifiable community carbon ledger token.
///         The ledger owner reads verified claims, hashes them (claimHash) and
///         mints credits for the benefit of the community account. Every mint
///         is attached to an immutable, on-chain attestation linking the claim
///         hash to its confidence score — the "trust layer" for community
///         carbon actions.
contract CarbonTraceCredits {
    string public constant name = "CarbonTrace Credits";
    string public constant symbol = "CTC";
    uint8 public constant decimals = 18;

    struct Attestation {
        uint96 nonce; // monotonically increasing claim counter
        uint8 confidencePercent; // verified confidence, 0..100
        uint40 attestedAt; // unix seconds
        bool exists;
    }

    address public minter; // the backend account allowed to attest + mint
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    mapping(bytes32 => Attestation) private _attestations;
    uint256 private _nonce;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Verified(
        address indexed community,
        bytes32 indexed claimHash,
        uint256 amount,
        uint256 nonce,
        uint8 confidencePercent
    );

    error Unauthorized();
    error AlreadyAttested(bytes32 claimHash);
    error InvalidConfidence(uint8 confidencePercent);
    error InsufficientBalance(address account, uint256 amount);

    constructor() {
        minter = msg.sender;
        _emitTransfer(address(0), msg.sender, 0);
    }

    modifier onlyMinter() {
        if (msg.sender != minter) revert Unauthorized();
        _;
    }

    /* ------------------------------ ESIP-20 core ----------------------------- */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        _allowances[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = _allowances[from][msg.sender];
        if (allowed != type(uint256).max) {
            _allowances[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) private {
        uint256 balance = _balances[from];
        if (balance < value) revert InsufficientBalance(from, value);
        require(to != address(0), "CTC: transfer to zero address");
        _balances[from] = balance - value;
        _balances[to] += value;
        _emitTransfer(from, to, value);
    }

    /* --------------------------- verification trusted ------------------------- */

    /// @notice Attest a verified claim hash and mint credits to `community`.
    function mint(address community, bytes32 claimHash, uint8 confidencePercent, uint256 amount)
        external
        onlyMinter
    {
        if (_attestations[claimHash].exists) revert AlreadyAttested(claimHash);
        if (confidencePercent > 100) revert InvalidConfidence(confidencePercent);

        _attestations[claimHash] = Attestation({
            nonce: uint96(_nonce++),
            confidencePercent: confidencePercent,
            attestedAt: uint40(block.timestamp),
            exists: true
        });

        _totalSupply += amount;
        _balances[community] += amount;
        _emitTransfer(address(0), community, amount);
        emit Verified(community, claimHash, amount, _nonce, confidencePercent);
    }

    /// @notice Look up the on-chain attestation for a claim hash.
    function verifyHash(bytes32 claimHash)
        external
        view
        returns (bool exists, uint256 nonce, uint8 confidencePercent, uint256 attestedAt)
    {
        Attestation memory a = _attestations[claimHash];
        return (a.exists, a.nonce, a.confidencePercent, a.attestedAt);
    }

    /// @notice Number of claims attested to date.
    function claimCount() external view returns (uint256) {
        return _nonce;
    }

    function _emitTransfer(address from, address to, uint256 value) private {
        emit Transfer(from, to, value);
    }
}